#!/usr/bin/env node
/* global AbortController, AbortSignal, console, DecompressionStream, fetch, process, TextEncoder, URL */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const REGISTRY = "gcr.io";
const REPOSITORY = "distroless/nodejs24-debian13";
const TAG = "nonroot";

// The first byte ('n') must not appear again in the prefix, because the
// streaming byte matcher uses a simplified reset (not full KMP). If the prefix
// ever changes, verify that this property still holds.
const VERSION_PREFIX = new TextEncoder().encode("node.js/v");
const CHAR_DOT = ".".charCodeAt(0);
const CHAR_ZERO = "0".charCodeAt(0);
const CHAR_NINE = "9".charCodeAt(0);

/**
 * @typedef {{ digest: string, size: number }} Layer
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(
      `HTTP ${String(response.status)} from ${url}: ${response.statusText}`,
    );
  }
  return response.json();
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  console.log("Fetching image manifest from GCR...");

  const tagsData = await fetchJson(
    `https://${REGISTRY}/v2/${REPOSITORY}/tags/list`,
  );
  if (!isObject(tagsData) || !isObject(tagsData["manifest"])) {
    throw new Error("Invalid tags response");
  }

  const digest = Object.entries(tagsData["manifest"]).find(
    ([, info]) =>
      isObject(info) && Array.isArray(info["tag"]) && info["tag"].includes(TAG),
  )?.[0];
  if (typeof digest !== "string") {
    throw new Error(`Could not find digest for tag: ${TAG}`);
  }

  console.log(`Image digest: ${digest}`);

  const manifestIndex = await fetchJson(
    `https://${REGISTRY}/v2/${REPOSITORY}/manifests/${digest}`,
  );
  if (
    !isObject(manifestIndex) ||
    !Array.isArray(manifestIndex["manifests"]) ||
    manifestIndex["manifests"].length === 0
  ) {
    throw new Error("Invalid manifest index");
  }

  // Any architecture contains the same Node.js version. Fetch all architecture
  // manifests in parallel and pick the one with the smallest largest-layer to
  // minimise the amount of data we need to stream.
  const archLayers = await Promise.all(
    manifestIndex["manifests"].map(async (entry) => {
      if (!isObject(entry) || typeof entry["digest"] !== "string") {
        throw new Error("Invalid manifest entry");
      }
      const manifest = await fetchJson(
        `https://${REGISTRY}/v2/${REPOSITORY}/manifests/${entry["digest"]}`,
      );
      if (
        !isObject(manifest) ||
        !Array.isArray(manifest["layers"]) ||
        manifest["layers"].length === 0
      ) {
        throw new Error("Invalid architecture manifest");
      }
      /** @type {Layer[]} */
      const layers = manifest["layers"];
      return layers;
    }),
  );

  /** @param {Layer[]} layers */
  function findLargestLayer(layers) {
    return layers.reduce((largest, layer) =>
      layer["size"] > largest["size"] ? layer : largest,
    );
  }

  /** @param {Layer[]} layers */
  function findSmallestLayer(layers) {
    return layers.reduce((smallest, layer) =>
      layer["size"] < smallest["size"] ? layer : smallest,
    );
  }

  const largestLayer = findSmallestLayer(archLayers.map(findLargestLayer));

  const sizeMB = (largestLayer["size"] / 1024 / 1024).toFixed(1);

  console.log(`Layer digest: ${largestLayer["digest"]} (${sizeMB} MB)`);
  console.log(
    `Layer URL: https://${REGISTRY}/v2/${REPOSITORY}/blobs/${largestLayer["digest"]}`,
  );

  const abortController = new AbortController();
  const response = await fetch(
    `https://${REGISTRY}/v2/${REPOSITORY}/blobs/${largestLayer["digest"]}`,
    {
      signal: AbortSignal.any([
        AbortSignal.timeout(60_000),
        abortController.signal,
      ]),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch layer: ${String(response.status)}`);
  }
  if (!response.body) {
    throw new Error("No response body");
  }

  const decompressor = new DecompressionStream("gzip");
  const reader = response.body.pipeThrough(decompressor).getReader();

  let bytesSeen = 0;
  /** @type {number[]} */
  const versionBytes = [];
  /** @type {string | null} */
  let nodeVersion = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break; // eslint-disable-line @typescript-eslint/no-unnecessary-condition

      for (const byte of value) {
        if (bytesSeen < VERSION_PREFIX.length) {
          if (byte === VERSION_PREFIX[bytesSeen]) {
            bytesSeen++;
          } else {
            bytesSeen = byte === VERSION_PREFIX[0] ? 1 : 0;
          }
        } else if (
          byte === CHAR_DOT ||
          (byte >= CHAR_ZERO && byte <= CHAR_NINE)
        ) {
          versionBytes.push(byte);
        } else {
          nodeVersion = String.fromCharCode(...versionBytes);
          break;
        }
      }
      if (nodeVersion) break;
    }
  } finally {
    void reader.cancel();
    abortController.abort();
  }

  if (!nodeVersion && versionBytes.length) {
    nodeVersion = String.fromCharCode(...versionBytes);
  }

  if (!nodeVersion) {
    throw new Error("Could not detect Node.js version in layer");
  }

  if (!/^\d+\.\d+\.\d+$/.test(nodeVersion)) {
    throw new Error(
      `Extracted version doesn't look like semver: ${nodeVersion}`,
    );
  }

  console.log(`Node.js version: ${nodeVersion}`);

  // Update package.json
  execFileSync("npm", ["pkg", "set", `engines.node=${nodeVersion}`], {
    stdio: "inherit",
  });

  // Update Dockerfile
  const image = `${REGISTRY}/${REPOSITORY}:${TAG}`;
  const imageWithDigest = `${image}@${digest}`;
  const dockerfilePath = new URL("./Dockerfile", import.meta.url);
  const updatedDockerFile = readFileSync(dockerfilePath, "utf8")
    .replace(/node:[^\s]+-trixie/g, `node:${nodeVersion}-trixie`)
    .replace(
      new RegExp(`FROM ${image}\\S* AS final`),
      `FROM ${imageWithDigest} AS final`,
    );
  writeFileSync(dockerfilePath, updatedDockerFile);
}

main().catch((/** @type {unknown} */ error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
