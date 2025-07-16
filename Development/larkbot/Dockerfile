# Multi-stage Dockerfile for Larkbot
# Stage 1: Base image with dependencies
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S larkbot -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Development image
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY --chown=larkbot:nodejs . .

# Create necessary directories
RUN mkdir -p logs exports tmp && \
    chown -R larkbot:nodejs logs exports tmp

# Switch to non-root user
USER larkbot

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=development

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 3: Production image
FROM base AS production

# Copy source code
COPY --chown=larkbot:nodejs . .

# Create necessary directories
RUN mkdir -p logs exports tmp && \
    chown -R larkbot:nodejs logs exports tmp

# Switch to non-root user
USER larkbot

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["dumb-init", "npm", "start"]

# Default target is production
FROM production