# syntax=docker/dockerfile:1.4

FROM --platform=$BUILDPLATFORM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
COPY vendor/ ./vendor/
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Tiny runtime image used only to copy static files into the nginx volume
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/dist ./dist
# Keep old hashed assets available for clients opened before the release.
# Copy dotfiles too: the gateway/build checks use the Vite manifest.
CMD ["sh", "-c", "cp -a /app/dist/. /usr/share/nginx/html/"]
