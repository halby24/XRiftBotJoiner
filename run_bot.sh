#!/bin/bash
# Wrapper script for cron execution
# Usage: ./run_bot.sh [Nickname]

# Ensure we are in the correct directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Set default nickname if not provided
NICKNAME=${1:-"XRiftBot"}

# Export necessary environment variables for Playwright in headless environments
export NICKNAME="$NICKNAME"
export HEADLESS="true"

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    npx playwright install chromium
fi

# Run the bot
echo "Starting bot at $(date)..."
node bot.js >> bot.log 2>&1
