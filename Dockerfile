# syntax=docker/dockerfile:1

# Build stage: Node LTS matching @types/node. Tests and lint run in CI, not here.
# The build output is static files, so build on the native platform instead of under QEMU emulation.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

# Install dependencies first, so this layer is reused as long as the lockfile does not change.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

# Runtime stage: nginx as a non-root user on port 8080, serving the static build and proxying the backend.
FROM nginxinc/nginx-unprivileged:1.30-alpine

# Backend address for the proxy; the entrypoint fills NGINX_LOCAL_RESOLVERS from /etc/resolv.conf.
ENV BACKEND_URL=http://backend:8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/proxy-backend.conf /etc/nginx/snippets/proxy-backend.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Checks nginx itself, not the backend, so the frontend stays healthy while the API restarts.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
