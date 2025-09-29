#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npx tsc

echo "Resolving path aliases..."
npx tsc-alias

echo "Build complete!"
