# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner

# Install yt-dlp and ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

# Create download temp directory
RUN mkdir -p /tmp/ytmagnet-downloads

# Environment
ENV NODE_ENV=production
ENV DEPLOYMENT_MODE=server
ENV DOWNLOAD_DIR=/tmp/ytmagnet-downloads
ENV YTDLP_PATH=yt-dlp
ENV FFMPEG_DIR=/usr/bin

EXPOSE 3000

CMD ["npm", "start"]
