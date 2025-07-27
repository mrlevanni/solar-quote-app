#!/bin/bash

# Solar Quote App Status Script

echo "🔍 Checking Solar Quote App status..."

# Check if process is running
PID=$(pgrep -f "node.*app.js")

if [ -n "$PID" ]; then
    echo "✅ Server is running"
    echo "📋 Process ID: $PID"
    
    # Check if port is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo "🌐 Port 3000: Listening"
        
        # Test HTTP response
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "🌐 HTTP Status: $HTTP_STATUS (OK)"
            echo "✅ Server is fully operational!"
            echo "🔗 Access at: http://localhost:3000"
        else
            echo "⚠️  HTTP Status: $HTTP_STATUS (Error)"
        fi
    else
        echo "❌ Port 3000: Not listening"
    fi
    
    echo ""
    echo "📊 Recent logs:"
    tail -5 server.log 2>/dev/null || echo "No logs found"
    
else
    echo "❌ Server is not running"
    echo "💡 Start with: ./start.sh"
fi