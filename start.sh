#!/bin/bash

# Kill any existing processes on port 5000 (Flask backend)
echo "Checking for processes on port 5000..."
pid=$(lsof -ti:5000)
if [ ! -z "$pid" ]; then
    echo "Killing process on port 5000"
    kill -9 $pid
fi

# Kill any existing processes on port 5173 (Vite frontend)
echo "Checking for processes on port 5173..."
pid=$(lsof -ti:5173)
if [ ! -z "$pid" ]; then
    echo "Killing process on port 5173"
    kill -9 $pid
fi

# Start the Flask backend
echo "Starting Flask backend..."
python3 main.py &

# Wait for the backend to start
sleep 5

# Start the frontend
echo "Starting frontend..."
npm run dev
