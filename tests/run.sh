#!/bin/bash
# Run all game section Playwright tests
# Prerequisites: npm install, playwright installed

set -e

echo "=== Running Connection Game Tests ==="
python3 "$(dirname "$0")/connection_game.py"

echo ""
echo "=== Running Live Predictions Tests ==="
python3 "$(dirname "$0")/live_predictions.py"

echo ""
echo "=== All tests completed ==="
