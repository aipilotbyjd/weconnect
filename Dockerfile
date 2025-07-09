# --- Base Stage: Defines common environment ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development Stage: For local development with hot-reloading ---
FROM base AS development
ENV NODE_ENV=development
# Install all dependencies, including devDependencies
RUN npm ci && npm cache clean --force
COPY . .
# Command is provided by docker-compose to enable hot-reloading
CMD ["npm", "run", "start:dev"]

# --- Build Stage: Creates the production build ---
FROM base AS builder
# Install all dependencies needed for the build process
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# --- Production Stage: The final, lightweight, and secure image ---
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Add dumb-init for proper signal handling (prevents zombie processes)
RUN apk add --no-cache dumb-init

# Copy dependency info and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the health check script
COPY src/health-check.js ./dist/health-check.js

# Create and use a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Healthcheck to ensure the container is running correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD [ "node", "dist/health-check.js" ]

# Use dumb-init to start the application gracefully
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]