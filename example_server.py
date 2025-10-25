#!/usr/bin/env python3
"""
WebSocket server for real-time CSV data visualization.

This server monitors a CSV file and sends its contents to connected
WebSocket clients whenever the file changes.

CSV Format:
    - Two columns: timestamp,value
    - No header row
    - Timestamp format: "2025-10-19 17:50:21.143882"

Requirements:
    pip install websockets

Usage:
    python example_server.py
"""

import asyncio
import json
import os
import csv
from pathlib import Path
from datetime import datetime
import websockets


# Configuration
CSV_FILE_PATH = "/Users/khamitovdr/bio_tools/examples/experiment_results_20251019_193343/Optical density.csv"  # Path to CSV file to monitor
CHECK_INTERVAL = 0.5  # Check file every 500ms
MAX_POINTS = 1000  # Maximum points to keep in memory


def get_measurement_name(file_path):
    """Extract measurement name from filename (without extension)."""
    return Path(file_path).stem


def parse_timestamp(timestamp_str):
    """
    Parse timestamp string to milliseconds since epoch.
    
    Supports formats:
    - "2025-10-19 17:50:21.143882"
    - "2025-10-19 17:50:21"
    - Unix milliseconds (int/float)
    
    Returns timestamp in milliseconds.
    """
    try:
        # Try to parse as datetime string
        if isinstance(timestamp_str, str) and '-' in timestamp_str:
            # Parse datetime format
            dt = datetime.fromisoformat(timestamp_str)
            # Convert to milliseconds
            return int(dt.timestamp() * 1000)
        else:
            # Try to parse as numeric (milliseconds)
            return int(float(timestamp_str))
    except Exception as e:
        raise ValueError(f"Cannot parse timestamp: {timestamp_str}") from e


def read_csv_data(file_path):
    """Read CSV file and return data as list of [timestamp, value] pairs."""
    data = []
    
    try:
        with open(file_path, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    try:
                        # Parse timestamp (handles both datetime strings and numeric)
                        timestamp = parse_timestamp(row[0])
                        value = float(row[1])
                        data.append([timestamp, value])
                    except (ValueError, IndexError):
                        # Skip invalid rows
                        continue
        
        # Keep only last MAX_POINTS
        if len(data) > MAX_POINTS:
            data = data[-MAX_POINTS:]
            
        return data
    
    except FileNotFoundError:
        print(f"Warning: File {file_path} not found")
        return []
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []


async def file_monitor(websocket):
    """Monitor CSV file and send data to client on changes."""
    print(f"Client connected: {websocket.remote_address}")
    
    measurement_name = get_measurement_name(CSV_FILE_PATH)
    last_modified = 0
    last_data = []
    
    try:
        while True:
            # Check if file has been modified
            try:
                current_modified = os.path.getmtime(CSV_FILE_PATH)
            except FileNotFoundError:
                # File doesn't exist yet, wait and retry
                await asyncio.sleep(CHECK_INTERVAL)
                continue
            
            # File changed or first read
            if current_modified != last_modified:
                last_modified = current_modified
                
                # Read CSV data
                data = read_csv_data(CSV_FILE_PATH)
                
                # Only send if data is not empty and has changed
                if data and data != last_data:
                    last_data = data
                    
                    # Send full dataset
                    message = {
                        measurement_name: data
                    }
                    
                    await websocket.send(json.dumps(message))
                    print(f"Sent {len(data)} points for '{measurement_name}' to {websocket.remote_address}")
            
            # Wait before next check
            await asyncio.sleep(CHECK_INTERVAL)
            
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Start WebSocket server on localhost:8004."""
    host = "localhost"
    port = 8005
    
    print("WebSocket server for CSV file monitoring")
    print(f"Monitoring file: {CSV_FILE_PATH}")
    print(f"Measurement name: {get_measurement_name(CSV_FILE_PATH)}")
    print(f"Server running on ws://{host}:{port}")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    # Check if file exists
    if not os.path.exists(CSV_FILE_PATH):
        print(f"\nWarning: CSV file '{CSV_FILE_PATH}' not found!")
        print("Server will wait for the file to be created...")
    
    async with websockets.serve(file_monitor, host, port):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped")

