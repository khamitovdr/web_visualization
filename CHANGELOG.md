# Changelog

## Full Dataset Update (October 2025)

### Major Changes

**Data Format Changed from Incremental to Full Dataset**

The application now expects complete datasets in each WebSocket message instead of individual data points. This is a **breaking change** that requires server updates.

### Why This Change?

✅ **Prevents Data Loss**: If a message is dropped, the next update contains all data  
✅ **No Synchronization Issues**: All series are always in sync  
✅ **Simpler State Management**: Replace instead of append  
✅ **Still Performant**: For 100-1000 points, full datasets are efficient  

### Old Format (Deprecated)
```json
{"timestamp": 1697712000000, "cpu": 45.2, "memory": 62.8}
```

### New Format
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
  ]
}
```

### What Changed

#### Client Side
- `src/services/websocket.ts`: Updated message interface to expect arrays
- `src/hooks/useRealtimeData.ts`: Changed from append to replace logic
- Data validation updated for new format

#### Server Side (Example Updated)
- `example_server.py`: Now maintains history and sends full datasets
- Server keeps last 1000 points per series

#### Documentation
- `README.md`: Updated data format section with examples
- `QUICKSTART.md`: Added data format explanation
- Added performance rationale

### Migration Guide

If you have an existing server implementation:

1. **Add data storage** to maintain historical points (e.g., last 1000)
2. **Change message format** from single point to array of points
3. **Send full dataset** on each update instead of incremental

**Example:**
```python
# Old (incremental)
data = {"timestamp": timestamp, "value": value}

# New (full dataset)
history.append([timestamp, value])
data = {"series1": history.copy()}
```

### Performance Notes

- **Network**: Sending 1000 points @ 10Hz ≈ 20-40 KB/s (acceptable)
- **Client**: Chart updates throttled to 60 FPS
- **Memory**: Circular buffer keeps max 1000 points per series
- **Tested**: Works smoothly on older machines

### Compatibility

❌ **Not backward compatible** with point-by-point servers  
✅ **Forward compatible** with full dataset approach  
✅ Example servers updated and tested  

