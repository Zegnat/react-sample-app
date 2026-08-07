#!/usr/bin/env node
/* global AbortSignal, console, fetch, process, URL */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// Re-pins the digest of every container base image the project's Dockerfiles
// use. For each image it resolves the current manifest digest of a rolling tag,
// reads a human-readable version from the image itself, and rewrites the pinned
// `FROM` line wherever it appears — the full `Dockerfile` (build + serve) and the
// CI-only `Dockerfile.ci` (serve a pre-built dist) both pin static-web-server, so
// both are kept in sync. Node additionally drives engines.node and @types/node.
//
// Rolling tags mean reruns pick up patch/minor releases within the current
// major on their own; a major jump shows up in the diff for a human to review.
// Node tracks `lts-alpine`, so it advances to the next LTS major automatically;
// static-web-server tracks `2-alpine`, so a v3 is a deliberate edit of its tag
// below. `version.kind` says where the concrete version lives in the image
// config: an "env" entry (`KEY=value` in config.Env) or a "label".

/**
 * @typedef {{
 *   name: string,
 *   tokenUrl: string,
 *   manifestBase: string,
 *   tag: string,
 *   version: { kind: "env" | "label", key: string },
 *   pattern: RegExp,
 *   replacement: string,
 *   syncNode: boolean,
 * }} ImageSpec
 */

/** @type {ImageSpec[]} */
const IMAGES = [
  {
    name: "Node.js",
    tokenUrl:
      "https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/node:pull",
    manifestBase: "https://registry-1.docker.io/v2/library/node",
    tag: "lts-alpine",
    version: { kind: "env", key: "NODE_VERSION" },
    pattern: /node:\d+\.\d+\.\d+-alpine(?:@sha256:[a-f0-9]{64})?/g,
    replacement: "node:{version}-alpine@{digest}",
    syncNode: true,
  },
  {
    // static-web-server publishes no cross-major alpine tag (no `alpine` /
    // `latest-alpine`), so we resolve the major-scoped rolling `2-alpine` tag
    // but pin the concrete `<version>-alpine` it currently points to. Moving to
    // a future major (v3) is a deliberate edit of this tag.
    name: "static-web-server",
    tokenUrl:
      "https://ghcr.io/token?scope=repository:static-web-server/static-web-server:pull",
    manifestBase: "https://ghcr.io/v2/static-web-server/static-web-server",
    tag: "2-alpine",
    version: { kind: "label", key: "org.opencontainers.image.version" },
    pattern:
      /ghcr\.io\/static-web-server\/static-web-server:\d+\.\d+\.\d+-alpine(?:@sha256:[a-f0-9]{64})?/g,
    replacement:
      "ghcr.io/static-web-server/static-web-server:{version}-alpine@{digest}",
    syncNode: false,
  },
];

const MANIFEST_ACCEPT = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} url
 * @param {Record<string, string>} [headers]
 * @returns {Promise<unknown>}
 */
async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)} from ${url}`);
  }
  return response.json();
}

/**
 * @param {string} tokenUrl
 * @returns {Promise<string>}
 */
async function fetchToken(tokenUrl) {
  const body = await fetchJson(tokenUrl);
  if (!isObject(body) || typeof body["token"] !== "string") {
    throw new Error("Invalid token response");
  }
  return body["token"];
}

/**
 * @param {string} manifestBase
 * @param {string} reference
 * @param {string} token
 * @returns {Promise<{ digest: string | null, body: unknown }>}
 */
async function fetchManifest(manifestBase, reference, token) {
  const response = await fetch(`${manifestBase}/manifests/${reference}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: MANIFEST_ACCEPT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `Manifest ${reference} failed: HTTP ${String(response.status)}`,
    );
  }
  return {
    digest: response.headers.get("docker-content-digest"),
    body: await response.json(),
  };
}

/**
 * Read the concrete version from an image config — from an `Env` entry
 * (`KEY=value`) or from a `Labels` map, per the spec.
 * @param {unknown} config
 * @param {{ kind: "env" | "label", key: string }} version
 * @returns {string}
 */
function readVersion(config, version) {
  if (!isObject(config) || !isObject(config["config"])) {
    throw new Error("Invalid image config");
  }
  const containerConfig = config["config"];

  if (version.kind === "env") {
    const env = containerConfig["Env"];
    if (!Array.isArray(env)) {
      throw new Error("Image config has no environment");
    }
    const prefix = `${version.key}=`;
    for (const entry of env) {
      if (typeof entry === "string" && entry.startsWith(prefix)) {
        return entry.slice(prefix.length);
      }
    }
    throw new Error(`Image config has no ${version.key}`);
  }

  const labels = containerConfig["Labels"];
  if (!isObject(labels)) {
    throw new Error("Image config has no labels");
  }
  const value = labels[version.key];
  if (typeof value !== "string") {
    throw new Error(`Image config has no ${version.key} label`);
  }
  return value;
}

/**
 * @param {ImageSpec} image
 * @returns {Promise<{ version: string, digest: string }>}
 */
async function resolveImage(image) {
  const token = await fetchToken(image.tokenUrl);

  // The rolling tag's manifest-list digest is what we pin.
  const index = await fetchManifest(image.manifestBase, image.tag, token);
  if (typeof index.digest !== "string") {
    throw new Error(`No content digest for ${image.tag}`);
  }
  if (!isObject(index.body) || !Array.isArray(index.body["manifests"])) {
    throw new Error("Invalid manifest index");
  }

  // Any architecture reports the same version; read it from one image's config.
  /** @type {string | null} */
  let imageDigest = null;
  for (const manifest of index.body["manifests"]) {
    if (
      isObject(manifest) &&
      isObject(manifest["platform"]) &&
      manifest["platform"]["architecture"] === "amd64" &&
      typeof manifest["digest"] === "string"
    ) {
      imageDigest = manifest["digest"];
      break;
    }
  }
  if (imageDigest === null) {
    throw new Error("Could not find an amd64 image manifest");
  }

  const imageManifest = await fetchManifest(
    image.manifestBase,
    imageDigest,
    token,
  );
  if (!isObject(imageManifest.body)) {
    throw new Error("Invalid image manifest");
  }
  const configDescriptor = imageManifest.body["config"];
  if (
    !isObject(configDescriptor) ||
    typeof configDescriptor["digest"] !== "string"
  ) {
    throw new Error("Image manifest has no config descriptor");
  }

  const config = await fetchJson(
    `${image.manifestBase}/blobs/${configDescriptor["digest"]}`,
    { Authorization: `Bearer ${token}` },
  );

  return { version: readVersion(config, image.version), digest: index.digest };
}

/**
 * Keep @types/node on the major matching the runtime; only act on a major
 * change so routine patch refreshes stay limited to engines.node.
 * @param {string} nodeVersion
 * @returns {void}
 */
function syncNodePackageJson(nodeVersion) {
  execFileSync("npm", ["pkg", "set", `engines.node=${nodeVersion}`], {
    stdio: "inherit",
  });
  const nodeMajor = nodeVersion.slice(0, nodeVersion.indexOf("."));
  const currentTypes = execFileSync(
    "npm",
    ["pkg", "get", "devDependencies.@types/node"],
    { encoding: "utf8" },
  );
  const currentTypesMajor = /(\d+)/.exec(currentTypes)?.[1];
  if (currentTypesMajor !== nodeMajor) {
    console.log(
      `  Aligning @types/node ${currentTypesMajor ?? "(none)"} -> ${nodeMajor}.x`,
    );
    execFileSync("npm", ["install", "--save-dev", `@types/node@${nodeMajor}`], {
      stdio: "inherit",
    });
  }
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const dockerfiles = ["Dockerfile", "Dockerfile.ci"].map((name) => ({
    name,
    url: new URL(`./${name}`, import.meta.url),
    text: readFileSync(new URL(`./${name}`, import.meta.url), "utf8"),
  }));

  for (const image of IMAGES) {
    console.log(`Resolving ${image.name} (${image.tag}) from the registry...`);
    const { version, digest } = await resolveImage(image);
    console.log(`  ${image.name} version: ${version}`);
    console.log(`  digest: ${digest}`);

    const pinned = image.replacement
      .replace("{version}", version)
      .replace("{digest}", digest);

    let matches = 0;
    for (const dockerfile of dockerfiles) {
      if (dockerfile.text.match(image.pattern) !== null) {
        dockerfile.text = dockerfile.text.replace(image.pattern, pinned);
        matches += 1;
      }
    }
    if (matches === 0) {
      console.warn(
        `  warning: no ${image.name} reference found in any Dockerfile`,
      );
    }

    if (image.syncNode) {
      syncNodePackageJson(version);
    }
  }

  for (const dockerfile of dockerfiles) {
    writeFileSync(dockerfile.url, dockerfile.text);
  }
}

main().catch((/** @type {unknown} */ error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
