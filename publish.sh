#!/bin/bash

# NPM Publishing Script for onscreen-recorder
# This script helps you publish the package to npm

set -e

echo "🚀 Preparing to publish onscreen-recorder to npm..."
echo ""

# Check if user is logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ You are not logged in to npm."
    echo "   Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"
echo ""

# Check if package name is available
echo "📦 Checking if package name 'onscreen-recorder' is available..."
if npm view onscreen-recorder &> /dev/null; then
    echo "⚠️  Package name 'onscreen-recorder' already exists on npm."
    echo "   You may need to:"
    echo "   1. Use a different name, or"
    echo "   2. Use a scoped package: @yourusername/onscreen-recorder"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Package name is available!"
fi

echo ""

# Build the package
echo "🔨 Building the package..."
npm run build:lib

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Show what will be published
echo "📋 Files that will be published:"
npm pack --dry-run 2>&1 | grep -A 100 "Tarball Contents" | head -20
echo ""

# Confirm before publishing
read -p "📤 Ready to publish? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish
echo "🚀 Publishing to npm..."
npm publish

echo ""
echo "✅ Package published successfully!"
echo ""
echo "📦 View your package at: https://www.npmjs.com/package/onscreen-recorder"
echo ""
echo "🧪 Test installation with: npm install onscreen-recorder"
