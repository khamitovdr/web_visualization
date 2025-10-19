#!/usr/bin/env python3
"""
Example WebSocket server for testing the real-time visualization app.

This server sends simulated data with multiple series (cpu, memory, disk)
to connected WebSocket clients.

Requirements:
    pip install websockets

Usage:
    python example_server.py
"""

import asyncio
import json
import time
import math
import websockets


async def data_generator(websocket):
    """Send simulated real-time data to connected clients."""
    print(f"Client connected: {websocket.remote_address}")
    
    try:
        start_time = time.time()
        counter = 0
        
        # Store historical data (keeping last 1000 points)
        max_points = 1000
        cpu_data = []
        memory_data = []
        disk_data = []
        
        while True:
            elapsed = time.time() - start_time
            timestamp = int(time.time() * 1000)  # milliseconds
            
            # Generate new data points
            cpu_value = 50 + 30 * math.sin(elapsed / 2)
            memory_value = 60 + 20 * math.cos(elapsed / 3)
            disk_value = 40 + 15 * math.sin(elapsed / 5)
            
            # Append to historical data
            cpu_data.append([timestamp, cpu_value])
            memory_data.append([timestamp, memory_value])
            disk_data.append([timestamp, disk_value])
            
            # Keep only last max_points
            if len(cpu_data) > max_points:
                cpu_data.pop(0)
                memory_data.pop(0)
                disk_data.pop(0)
            
            # Send FULL dataset each time
            data = {
                "cpu": cpu_data.copy(),
                "memory": memory_data.copy(),
                "disk": disk_data.copy(),
            }
            
            await websocket.send(json.dumps(data))
            
            counter += 1
            if counter % 100 == 0:
                print(f"Sent {counter} updates ({len(cpu_data)} points per series) to {websocket.remote_address}")
            
            # Send data every 100ms (10 updates per second)
            await asyncio.sleep(0.1)
            
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Start WebSocket server on localhost:8004."""
    host = "localhost"
    port = 8004
    
    print(f"Starting WebSocket server on ws://{host}:{port}")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    async with websockets.serve(data_generator, host, port):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped")

