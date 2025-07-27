#!/bin/bash

# Solar Quote App Stop Script

echo "Stopping Solar Quote App server..."

# Find and kill node processes
PID=$(pgrep -f "node.*app.js")

if [ -n "$PID" ]; then
    echo "Found server with PID: $PID"
    kill $PID
    
    # Wait for graceful shutdown
    sleep 2
    
    # Force kill if still running
    if kill -0 $PID 2>/dev/null; then
        echo "Force killing server..."
        kill -9 $PID
    fi
    
    echo "✅ Server stopped successfully!"
else
    echo "⚠️  No running server found"
fi