#!/bin/bash

# Hourly Git Commit Script
# This script helps maintain regular commits without overwhelming the git history

echo "🕐 Hourly Git Commit - $(date)"

# Check if there are any changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit"
    exit 0
fi

# Add all changes
git add .

# Create commit with timestamp
git commit -m "🔄 Hourly update - $(date '+%Y-%m-%d %H:%M:%S')

- Auto-commit of accumulated changes
- Regular checkpoint for development progress"

echo "✅ Changes committed successfully"
echo "📝 Next commit will be in 1 hour"
