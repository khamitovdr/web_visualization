# Quick Start Guide

Get up and running with the real-time visualization app in 3 steps!

## Step 1: Install Dependencies

```bash
yarn install
```

## Step 2: Start the Python Test Server

```bash
# Install websockets if needed
pip install websockets

# Run the server
python example_server.py
```

The server will start on `ws://localhost:8004` and send simulated data (CPU, memory, disk usage).

## Step 3: Start the Web App

In a new terminal:

```bash
yarn dev
```

Open your browser to `http://localhost:3000`

## Using the App

1. The server URL should already be set to `ws://localhost:8004`
2. Click **Connect** button
3. Watch the real-time data visualization!

### Controls

- **Pause/Resume**: Freeze the chart (data still buffers in background)
- **Clear**: Reset all chart data
- **Disconnect**: Close WebSocket connection

## Next Steps

To use with your own server:

1. Implement a WebSocket server that sends JSON messages with **full datasets**
2. Format: `{"metric1": [[ts, val], ...], "metric2": [[ts, val], ...]}`
3. Each message should contain all historical data (not incremental updates)
4. Enter your server URL in the app
5. Click Connect

### Data Format Example
```json
{
  "temperature": [
    [1697712000000, 23.5],
    [1697712001000, 23.7],
    [1697712002000, 23.9]
  ],
  "humidity": [
    [1697712000000, 45.2],
    [1697712001000, 45.8],
    [1697712002000, 46.1]
  ]
}
```

**Why full datasets?** This approach eliminates data loss if messages are dropped and ensures all series stay synchronized.

See `README.md` for detailed documentation and complete server examples.

