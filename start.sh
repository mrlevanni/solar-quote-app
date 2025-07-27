#!/bin/bash

# Solar Quote App Start Script

# Kill existing server
echo "Stopping existing server..."
pkill -f "node.*app.js" 2>/dev/null || true

# Wait a moment
sleep 2

# Start new server
echo "Starting Solar Quote App server..."
cd "$(dirname "$0")"
node src/app.js > server.log 2>&1 &

# Wait for server to start
sleep 3

# Check if server is running
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Server started successfully!"
    echo "🌐 Access at: http://localhost:3000"
    echo "📋 Server PID: $(pgrep -f 'node.*app.js')"
    echo "📝 Logs: tail -f server.log"
else
    echo "❌ Server failed to start!"
    echo "📝 Check logs: cat server.log"
    exit 1
fi