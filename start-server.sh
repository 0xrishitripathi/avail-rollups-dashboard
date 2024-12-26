#!/bin/bash

PORT=3005
MAX_RETRIES=5
RETRY_COUNT=0

# Kill any existing processes using the port
echo "Checking for existing processes on port $PORT..."
while lsof -i :$PORT >/dev/null 2>&1; do
    echo "Killing process on port $PORT..."
    fuser -k $PORT/tcp
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "Failed to free up port $PORT after $MAX_RETRIES attempts"
        exit 1
    fi
done

# Kill any existing node server processes
echo "Checking for existing Node.js processes..."
pkill -f "node server.js"
sleep 2

# Start the server
echo "Starting server..."
node server.js > server.log 2>&1 &
PID=$!

# Wait for server to start
sleep 3
if ps -p $PID > /dev/null; then
    echo $PID > server.pid
    echo "Server started successfully (PID: $PID)"
    echo "Logs available in server.log"
else
    echo "Server failed to start. Check server.log for details."
    exit 1
fi