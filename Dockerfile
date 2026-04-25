FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS build
WORKDIR /app
RUN chown node:node /app
USER node
COPY [".npmrc", "package.json", "package-lock.json", "/app/"]
RUN npm ci
COPY ["analysis.ts", "vite.build.config.mts", "/app/"]
COPY ["src", "/app/src"]
RUN npm run build

FROM joseluisq/static-web-server:2@sha256:2d67e47e22172235e339908777e692006ffdcf42dc4c531aff5d4337a7559a1e AS final
COPY --from=build --chown=sws:sws ["/app/dist", "/home/sws/public"]
