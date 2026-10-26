#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "===> Running root build script for FlowPulse on Render..."

if [ -d "backend" ]; then
    echo "===> Navigating to backend directory..."
    cd backend
fi

chmod +x build.sh
./build.sh
