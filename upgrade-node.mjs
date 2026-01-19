#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const REGISTRY = 'gcr.io';
const REPOSITORY = 'distroless/nodejs24-debian13';
const TAG = 'nonroot';

const VERSION_PREFIX = new TextEncoder().encode('node.js/v');
const CHAR_DOT = '.'.charCodeAt(0);
const CHAR_ZERO = '0'.charCodeAt(0);
const CHAR_NINE = '9'.charCodeAt(0);

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  console.log('Fetching image manifest from GCR...');

  const tagsData = await fetchJson(`https://${REGISTRY}/v2/${REPOSITORY}/tags/list`);
  if (!isObject(tagsData) || !isObject(tagsData['manifest'])) {
    throw new Error('Invalid tags response');
  }

  const digest = Object.entries(tagsData['manifest'])
    .find(([, info]) => isObject(info) && Array.isArray(info['tag']) && info['tag'].includes(TAG))?.[0];
  if (typeof digest !== 'string') {
    throw new Error(`Could not find digest for tag: ${TAG}`);
  }

  console.log(`Image digest: ${digest}`);

  const manifestIndex = await fetchJson(`https://${REGISTRY}/v2/${REPOSITORY}/manifests/${digest}`);
  if (!isObject(manifestIndex) || !Array.isArray(manifestIndex['manifests']) || manifestIndex['manifests'].length === 0) {
    throw new Error('Invalid manifest index');
  }

  const archManifestEntry = manifestIndex['manifests'][0];
  if (!isObject(archManifestEntry) || typeof archManifestEntry['digest'] !== 'string') {
    throw new Error('Invalid manifest entry');
  }

  const archManifest = await fetchJson(
    `https://${REGISTRY}/v2/${REPOSITORY}/manifests/${archManifestEntry['digest']}`
  );
  if (!isObject(archManifest) || !Array.isArray(archManifest['layers']) || archManifest['layers'].length === 0) {
    throw new Error('Invalid architecture manifest');
  }

  const largestLayer = archManifest['layers'].reduce((largest, layer) => {
    const largestSize = isObject(largest) && typeof largest['size'] === 'number' ? largest['size'] : 0;
    const layerSize = isObject(layer) && typeof layer['size'] === 'number' ? layer['size'] : 0;
    return layerSize > largestSize ? layer : largest;
  });
  if (!isObject(largestLayer) || typeof largestLayer['digest'] !== 'string' || typeof largestLayer['size'] !== 'number') {
    throw new Error('Invalid layer data');
  }

  const sizeMB = (largestLayer['size'] / 1024 / 1024).toFixed(1);

  console.log(`Layer digest: ${largestLayer['digest']} (${sizeMB} MB)`);
  console.log(`Layer URL: https://${REGISTRY}/v2/${REPOSITORY}/blobs/${largestLayer['digest']}`);

  const abortController = new AbortController();
  const response = await fetch(
    `https://${REGISTRY}/v2/${REPOSITORY}/blobs/${largestLayer['digest']}`,
    { signal: abortController.signal }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch layer: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('No response body');
  }

  const decompressor = new DecompressionStream('gzip');
  const reader = response.body.pipeThrough(decompressor).getReader();

  let bytesSeen = 0;
  /** @type {number[]} */
  const versionBytes = [];
  /** @type {string | null} */
  let nodeVersion = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;

      for (const byte of value) {
        if (bytesSeen < VERSION_PREFIX.length) {
          if (byte === VERSION_PREFIX[bytesSeen]) {
            bytesSeen++;
          } else {
            bytesSeen = byte === VERSION_PREFIX[0] ? 1 : 0;
          }
        } else if (byte === CHAR_DOT || (byte >= CHAR_ZERO && byte <= CHAR_NINE)) {
          versionBytes.push(byte);
        } else {
          nodeVersion = String.fromCharCode(...versionBytes);
          break;
        }
      }
      if (nodeVersion) break;
    }
  } finally {
    reader.cancel();
    abortController.abort();
  }

  if (!nodeVersion && versionBytes.length) {
    nodeVersion = String.fromCharCode(...versionBytes);
  }

  if (!nodeVersion) {
    throw new Error('Could not detect Node.js version in layer');
  }

  console.log(`Node.js version: ${nodeVersion}`);

  // Update package.json
  execSync(`npm pkg set engines.node=${nodeVersion}`, { stdio: 'inherit' });

  // Update Dockerfile
  const image = `${REGISTRY}/${REPOSITORY}:${TAG}`;
  const imageWithDigest = `${image}@${digest}`;
  const dockerfilePath = new URL('./Dockerfile', import.meta.url);
  const updatedDockerFile = readFileSync(dockerfilePath, 'utf8')
    .replace(/node:[^\s]+-trixie/g, `node:${nodeVersion}-trixie`)
    .replace(new RegExp(`FROM ${image}\\S* AS final`), `FROM ${imageWithDigest} AS final`);
  writeFileSync(dockerfilePath, updatedDockerFile);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
