# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner

# Cache-bust arg — increment YTDLP_BUILD on Render "Manual Deploy" to force yt-dlp re-fetch
ARG YTDLP_BUILD=1

# Install yt-dlp (latest, force-reinstall so Manual Deploy always gets newest version),
# ffmpeg, and wget (used by HEALTHCHECK).
# bgutil-ytdlp-pot-provider is NOT available on PyPI — install from GitHub if needed:
#   pip3 install git+https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git
# Skipped here to avoid git dependency; add manually if YouTube bot gates persist.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg wget && \
    pip3 install --break-system-packages --upgrade --force-reinstall yt-dlp && \
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
# Optional cookie file path — set on Render Dashboard as env var + Secret File
# ENV YTDLP_COOKIES_FILE=/etc/yt-dlp-cookies.txt

EXPOSE 3000

# Healthcheck — Render also pings / by default, but explicit is safer
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["npm", "start"]
