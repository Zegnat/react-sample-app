#!/usr/bin/env bash
# Build the production image, serve it with static-web-server, and run the e2e
# suite against that container — validating the in-container `npm ci` + build
# and that SWS serves the result. The container is always torn down on exit.
set -euo pipefail

IMAGE=sws-e2e
NAME=sws-e2e-run
PORT=4173

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cleanup # clear any stale container from a previous run
docker build -t "$IMAGE" .
docker run -d --rm --name "$NAME" -p "$PORT:80" "$IMAGE" >/dev/null

# Wait for static-web-server to come up.
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:$PORT/" >/dev/null; then break; fi
  sleep 1
done

npx playwright test --config=playwright.docker.config.mts
