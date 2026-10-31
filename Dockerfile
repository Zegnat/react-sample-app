# syntax=docker/dockerfile:1
FROM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build
WORKDIR /app
RUN chown node:node /app
USER node
COPY [".npmrc", "package.json", "package-lock.json", "/app/"]
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci --ignore-scripts
COPY ["analysis.ts", "vite.build.config.mts", "/app/"]
COPY ["src", "/app/src"]
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2.44.1@sha256:94618e3d17802265a21926217e6f9e7832b311b6fbf5933684001739fafed06a AS final
COPY --from=build ["/app/dist", "/public"]
USER 65532:65532
