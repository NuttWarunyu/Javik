#!/bin/bash

# GitHub Setup Script for TikTok Automation
# Usage: ./setup-github.sh YOUR_GITHUB_USERNAME

set -e

GITHUB_USERNAME=$1

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: Please provide your GitHub username"
    echo "Usage: ./setup-github.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

echo "🚀 Setting up GitHub repository..."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Check if .env exists and warn user
if [ -f ".env" ]; then
    echo "⚠️  Warning: .env file exists. Make sure it's in .gitignore!"
    if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo "❌ Error: .env is not in .gitignore! Please add it first."
        exit 1
    fi
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Initial commit: TikTok Automation with mobile-first design and production-ready setup"
fi

# Set up remote
REPO_URL="https://github.com/${GITHUB_USERNAME}/tiktok-automation.git"

echo "🔗 Setting up remote repository..."
if git remote get-url origin &> /dev/null; then
    echo "⚠️  Remote 'origin' already exists. Updating..."
    git remote set-url origin $REPO_URL
else
    git remote add origin $REPO_URL
fi

# Set default branch to main
echo "🌿 Setting default branch to main..."
git branch -M main

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a repository on GitHub: https://github.com/new"
echo "   - Name: tiktok-automation"
echo "   - Choose Public or Private"
echo "   - DO NOT initialize with README"
echo ""
echo "2. Then run:"
echo "   git push -u origin main"
echo ""
echo "Or if you want to push now, make sure the repository exists and run:"
echo "   git push -u origin main"

