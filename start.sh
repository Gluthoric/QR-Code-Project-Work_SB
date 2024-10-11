#!/bin/bash

# Function to handle the cleanup when Ctrl+C is pressed
cleanup() {
    echo "Stopping Flask backend and frontend..."

    # Kill the Flask backend process
    if [ ! -z "$flask_pid" ]; then
        echo "Killing Flask backend (PID $flask_pid)..."
        kill -9 $flask_pid
    fi

    # Kill the Vite frontend process
    if [ ! -z "$vite_pid" ]; then
        echo "Killing Vite frontend (PID $vite_pid)..."
        kill -9 $vite_pid
    fi

    exit 0
}

# Trap Ctrl+C (SIGINT) and run the cleanup function
trap cleanup SIGINT

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
flask_pid=$!  # Store the Flask backend process ID

# Wait for the backend to start
sleep 5

# Start the frontend (Vite)
echo "Starting frontend..."
npm run dev -- --host 0.0.0.0 --port 5173 &
vite_pid=$!  # Store the Vite frontend process ID

# Wait for both processes to finish or be killed
wait $flask_pid
wait $vite_pid
