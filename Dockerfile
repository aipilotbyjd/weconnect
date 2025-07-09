# Multi-stage production Dockerfile

# ─── Builder Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# ─── Production Stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Use dumb-init to handle PID 1 signals
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app
RUN chown nestjs:nodejs /app

USER nestjs

# Copy built artefacts
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Prepare uploads
RUN mkdir -p uploads

EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
