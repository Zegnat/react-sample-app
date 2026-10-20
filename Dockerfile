# syntax=docker/dockerfile:1
FROM node:26.12.0-alpine@sha256:6f08a523443ddedf52941874c203475b0ad503e859ad70cb26ab8be9a517dbd5 AS build
WORKDIR /app
RUN chown node:node /app
USER node
COPY [".npmrc", "package.json", "package-lock.json", "/app/"]
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci --ignore-scripts
COPY ["analysis.ts", "vite.build.config.mts", "/app/"]
COPY ["src", "/app/src"]
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2.44.0-alpine@sha256:c6704bc8f1fe05378d91c3288495ce2e0131cf31cf8956f117cb1c7d83c49c31 AS final
COPY --from=build --chown=sws:sws ["/app/dist", "/home/sws/public"]
