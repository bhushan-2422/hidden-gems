#!/bin/bash
# Start a local development server
# Usage: ./start.sh [port]

PORT=${1:-8000}

echo "Starting Hidden Trails Maharashtra on http://localhost:$PORT"
echo "Press Ctrl+C to stop"

if command -v python3 &> /dev/null; then
  python3 -m http.server "$PORT"
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer "$PORT"
elif command -v node &> /dev/null; then
  npx serve . -l "$PORT"
else
  echo "Error: No server found. Install Python or Node.js."
  exit 1
fi
