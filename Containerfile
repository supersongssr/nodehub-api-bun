# Containerfile for Podman
# Build: podman build -t nodehub-api .
# Run: podman run -d --name nodehub-api -p 3000:3000 -v $(pwd)/config:/app/config -v $(pwd)/templates:/app/templates -v $(pwd)/data:/app/data nodehub-api

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Production image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["bun", "run", "start"]
