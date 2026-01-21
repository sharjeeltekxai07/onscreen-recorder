#!/bin/bash

# Script to push onscreen-recorder to GitHub
# Repository: https://github.com/sharjeel884/onscreen-recorder.git

set -e

GIT_REPO="https://github.com/sharjeel884/onscreen-recorder.git"

echo "🚀 Preparing to push to GitHub..."
echo "Repository: $GIT_REPO"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already initialized"
fi

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)
    if [ "$CURRENT_REMOTE" != "$GIT_REPO" ]; then
        echo "⚠️  Remote 'origin' exists but points to different URL:"
        echo "   Current: $CURRENT_REMOTE"
        echo "   Expected: $GIT_REPO"
        read -p "   Update remote? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$GIT_REPO"
            echo "✅ Remote updated"
        fi
    else
        echo "✅ Remote 'origin' is correctly configured"
    fi
else
    echo "➕ Adding remote 'origin'..."
    git remote add origin "$GIT_REPO"
    echo "✅ Remote added"
fi

# Add all files
echo ""
echo "📝 Staging files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Show status
    echo ""
    echo "📋 Files to be committed:"
    git status --short
    
    # Commit
    echo ""
    read -p "💬 Enter commit message (or press Enter for default): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Initial commit: Screen recorder React component package"
    fi
    
    echo ""
    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG"
    echo "✅ Changes committed"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
echo "   Branch: $CURRENT_BRANCH"
echo "   Remote: origin"
echo ""

# Check if branch exists on remote
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    echo "⚠️  Branch '$CURRENT_BRANCH' already exists on remote"
    read -p "   Force push? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin "$CURRENT_BRANCH" --force
    else
        git push -u origin "$CURRENT_BRANCH"
    fi
else
    git push -u origin "$CURRENT_BRANCH"
fi

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🌐 View your repository at: $GIT_REPO"
echo ""
echo "📦 Next steps:"
echo "   1. Update package.json author field if needed"
echo "   2. Build the package: npm run build:lib"
echo "   3. Publish to npm: npm publish"
