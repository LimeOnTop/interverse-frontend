# syntax=docker/dockerfile:1.4

FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Tiny runtime image used only to copy static files into the nginx volume
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "rm -rf /usr/share/nginx/html/* && cp -r /app/dist/* /usr/share/nginx/html/"]
