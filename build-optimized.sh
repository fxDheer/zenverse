#!/bin/bash
# Ultra-optimized build script for Render deployment
export NODE_OPTIONS="--max-old-space-size=2048"
export GENERATE_SOURCEMAP=false
export CI=false
export SKIP_PREFLIGHT_CHECK=true

echo "Starting optimized build..."
cd client
npm ci --production --no-optional --no-audit --no-fund --silent
npm run build
echo "Build completed!"
