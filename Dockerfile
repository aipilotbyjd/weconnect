# --- Base Stage: Common setup ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development Stage ---
FROM base AS development
ENV NODE_ENV=development
RUN npm ci && npm cache clean --force
COPY . .
CMD ["npm", "run", "start:dev"]

# --- Build Stage ---
FROM base AS builder
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# --- Production Stage (Final Image) ---
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Add dumb-init for better signal handling
RUN apk add --no-cache dumb-init

# Copy only production dependencies and built code
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Create and use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]