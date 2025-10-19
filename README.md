# Real-time Data Visualization

A lightweight, performant web application for visualizing real-time CSV-like data through WebSocket connections. Built with React, TypeScript, Vite, and uPlot for optimal performance even on older machines.

## Features

- **Real-time Updates**: WebSocket-based data streaming with automatic reconnection
- **High Performance**: Uses uPlot charting library (~45KB) optimized for 1000+ data points
- **Multiple Series**: Automatically detects and plots multiple data series
- **Basic Controls**: Connect/Disconnect, Pause/Resume, Clear data
- **Configurable Server**: Easy server address configuration
- **Responsive Design**: Works on desktop and mobile devices
- **Lightweight**: Minimal dependencies, fast load times

## Prerequisites

- Node.js 16+ 
- Yarn package manager

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
yarn install
```

## Running the Application

Development mode:
```bash
yarn dev
```

The app will be available at `http://localhost:3000`

Build for production:
```bash
yarn build
```

Preview production build:
```bash
yarn preview
```

## Usage

1. **Configure Server Address**: Enter your WebSocket server URL (default: `ws://localhost:8004`)
2. **Connect**: Click the "Connect" button to establish WebSocket connection
3. **View Data**: Real-time data will appear on the chart automatically
4. **Controls**:
   - **Pause/Resume**: Pause chart updates (data still buffered in background)
   - **Clear**: Clear all chart data
   - **Disconnect**: Close WebSocket connection

## Data Format

The application expects JSON messages containing **complete datasets** for each series. This approach eliminates data loss and synchronization issues.

### Format Structure
```json
{
  "series_name": [[timestamp1, value1], [timestamp2, value2], ...],
  "another_series": [[timestamp1, value1], [timestamp2, value2], ...]
}
```

### Example with Multiple Series
```json
{
  "cpu": [
    [1697712000000, 45.2],
    [1697712001000, 46.1],
    [1697712002000, 44.8]
  ],
  "memory": [
    [1697712000000, 62.8],
    [1697712001000, 63.2],
    [1697712002000, 62.5]
  ],
  "disk": [
    [1697712000000, 33.1],
    [1697712001000, 33.3],
    [1697712002000, 33.0]
  ]
}
```

**Requirements:**
- Each message contains the **full dataset** (not incremental)
- Format: `{ "series_name": [[timestamp, value], ...] }`
- Timestamps in milliseconds (Unix epoch)
- Server maintains history (e.g., last 1000 points)
- Each update replaces all previous data

**Why Full Dataset?**
- ✅ No data loss if messages are dropped
- ✅ No synchronization issues between series
- ✅ Simpler state management
- ✅ Still performant for 100-1000 points

## WebSocket Server Example (Python)

Here's a Python WebSocket server implementation for testing:

```python
#!/usr/bin/env python3
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
                print(f"Sent {counter} updates ({len(cpu_data)} points per series)")
            
            # Send data every 100ms (10 updates per second)
            await asyncio.sleep(0.1)
            
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    """Start WebSocket server."""
    print("Starting WebSocket server on ws://localhost:8004")
    async with websockets.serve(data_generator, "localhost", 8004):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
```

To run the example server:

1. Install websockets library:
```bash
pip install websockets
```

2. Save the code above as `server.py` and run:
```bash
python server.py
```


## Performance

- **Chart Library**: uPlot (~45KB minified) - extremely fast rendering
- **Data Points**: Efficiently handles 100-1000 points with smooth updates
- **Update Rate**: Throttled to 60 FPS for optimal performance
- **Memory**: Circular buffer automatically manages memory (max 1000 points per series)
- **Old Hardware**: Optimized to run smoothly on older browsers and machines

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Architecture

```
src/
├── components/
│   ├── Chart.tsx          # uPlot chart component
│   └── Controls.tsx       # Control panel UI
├── hooks/
│   └── useRealtimeData.ts # Data buffering and management
├── services/
│   └── websocket.ts       # WebSocket connection handler
├── App.tsx                # Main application
├── App.css                # Application styles
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Troubleshooting

**Connection fails:**
- Ensure WebSocket server is running
- Check server address format (must start with `ws://` or `wss://`)
- Verify firewall settings

**Chart not updating:**
- Check browser console for errors
- Verify data format matches expected JSON structure
- Ensure timestamp is in milliseconds

**Performance issues:**
- Reduce data sending rate on server
- Decrease number of concurrent data series
- Check browser DevTools for memory leaks

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

