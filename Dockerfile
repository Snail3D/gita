FROM node:20-alpine

# Install curl for healthcheck, ffmpeg/ffplay for audio playback if enabled
RUN apk add --no-cache curl ffmpeg \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Set correct ownership for the workspace
RUN chown appuser:appgroup /app

# Switch to non-root user for security
USER appuser

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production

COPY --chown=appuser:appgroup . .

# Ensure output directory exists and is writable by the non-root user
RUN mkdir -p /app/data/out

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
