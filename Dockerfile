# Dockerfile for Railway deployment
FROM node:18-alpine

# Install FFmpeg and required dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend files
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Create output directories
RUN mkdir -p output/videos output/captions output/temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "backend/server.js"]

