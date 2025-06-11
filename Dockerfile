# IMPORTANT
# This Dockerfile builds an image that is equal to running Vite locally. This is
# not meant to be a production deployable image. For a production image, the
# final output should be added to a distroless container only containing an HTTP
# server and the static Vite output.

FROM node:24.2.0-bookworm AS build
WORKDIR /app
COPY ["package.json", "package-lock.json", "/app/"]
RUN npm ci
COPY ["analysis.ts", "vite.build.config.mts", "/app/"]
COPY ["src", "/app/src"]
RUN npm run build

FROM node:24.2.0-bookworm AS vite
WORKDIR /app
RUN npm install vite

# Note that Distroless does not tag exact node versions, for replication we fix the hash
FROM gcr.io/distroless/nodejs24-debian12@sha256:79465ad7671f8f8b318860e8c152baf34748cf819297401eff65accf923c2ca5 AS final
ENV NODE_ENV=production
COPY --from=build ["/app/dist", "/app/dist"]
COPY --from=vite ["/app/node_modules", "/app/node_modules"]
COPY ["./vite.build.config.mts", "/app/vite.build.config.mts"]
WORKDIR /app
CMD [ "node_modules/.bin/vite", "preview", "--host", "--", "--config", "vite.build.config.mts" ]
