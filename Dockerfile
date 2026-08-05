FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS build
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
