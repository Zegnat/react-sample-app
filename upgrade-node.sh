#!/usr/bin/env bash
set -euo pipefail

IMAGE=gcr.io/distroless/nodejs24-debian12

# Use gcrane to request the exact digest of the latest Distroless LTS Node.js
DIGEST=$(docker run --rm gcr.io/go-containerregistry/gcrane digest ${IMAGE}:nonroot 2>/dev/null)

# Get the exact version of Node.js from the container
VERSION=$(docker run --rm ${IMAGE}@${DIGEST} "-v")

fnm use --install-if-missing ${VERSION}
echo "Distroless digest: ${DIGEST}"
npm pkg set "engines.node"="${VERSION:1}"
sed -E -i "" "s|node:[^-]+-bookworm|node:${VERSION:1}-bookworm|" Dockerfile
sed -E -i "" "s|FROM .+ AS final|FROM ${IMAGE}@${DIGEST} AS final|" Dockerfile
