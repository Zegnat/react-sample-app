#!/usr/bin/env bash
set -euo pipefail

IMAGE=gcr.io/distroless/nodejs24-debian13:nonroot

echo -n "Pulling image: "
docker image pull --quiet ${IMAGE}

# Use docker inspect to get the exact tag and digest of the latest Distroless LTS Node.js
REPO_TAG=$(docker image inspect --format='{{index .RepoTags 0}}' ${IMAGE})
REPO_DIGEST=$(docker image inspect --format='{{index .RepoDigests 0}}' ${IMAGE})
DIGEST="${REPO_TAG}@${REPO_DIGEST##*@}"

# Get the exact version of Node.js from the container
VERSION=$(docker container run --pull never --rm ${DIGEST} "-v")

fnm use --install-if-missing ${VERSION}
echo "Distroless digest: ${DIGEST}"
npm pkg set "engines.node"="${VERSION:1}"
sed -E -i "" "s|node:[^-]+-trixie|node:${VERSION:1}-trixie|" Dockerfile
sed -E -i "" "s|FROM .+ AS final|FROM ${DIGEST} AS final|" Dockerfile
