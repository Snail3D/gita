#!/usr/bin/env bash

set -e

echo "🚀 Starting smoke test..."

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Build and start the gita service in the background
echo "📦 Building and starting gita service..."
docker-compose up -d --build

echo "⏳ Waiting for service to become healthy..."
# Poll the health endpoint
for i in {1..30}; do
  if curl -s http://localhost:3000/health | grep -q '"status":"ok"'; then
    echo "✅ Service is healthy!"
    
    # Run a quick API test
    echo "🧪 Testing /duplex/status endpoint..."
    STATUS=$(curl -s http://localhost:3000/duplex/status)
    if echo "$STATUS" | grep -q '"success":true'; then
      echo "✅ /duplex/status endpoint working!"
    else
      echo "❌ /duplex/status failed: $STATUS"
      docker-compose logs
      docker-compose down
      exit 1
    fi

    # Tear down
    echo "🧹 Tearing down..."
    docker-compose down
    echo "🎉 Smoke test passed successfully!"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo "❌ Service failed to become healthy in time!"
docker-compose logs
docker-compose down
exit 1
