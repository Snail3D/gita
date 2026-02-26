#!/usr/bin/env bash

set -e

echo "🚀 Starting Gita Headless..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found! Using .env.example as a template..."
  cp .env.example .env
  echo "⚠️  Please update the .env file with your API keys if necessary."
fi

# Ensure output directory exists
mkdir -p data/out

# Start the service using Docker Compose in detached mode
echo "📦 Running docker-compose up -d..."
docker-compose up -d --build

echo "✅ Gita is running in the background!"
echo "📄 View logs using: docker-compose logs -f"
echo "🛑 Stop the service using: docker-compose down"
