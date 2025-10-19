import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '../services/websocket';

export interface DataSeries {
  name: string;
  data: number[][];
}

const MAX_DATA_POINTS = 1000;

export function useRealtimeData() {
  const [series, setSeries] = useState<DataSeries[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const dataBufferRef = useRef<Map<string, number[][]>>(new Map());
  const lastUpdateRef = useRef<number>(0);
  const throttleDelay = 16; // ~60 FPS

  const updateSeries = useCallback(() => {
    const newSeries: DataSeries[] = [];

    dataBufferRef.current.forEach((data, name) => {
      newSeries.push({
        name,
        data: [...data], // Create a copy to trigger React update
      });
    });

    setSeries(newSeries);
  }, []);

  const addDataPoint = useCallback(
    (message: WebSocketMessage) => {
      // Message now contains full dataset for each series
      // Format: { "cpu": [[ts, val], ...], "memory": [[ts, val], ...] }

      const seriesNames = Object.keys(message);

      // Replace all data with the new full dataset
      seriesNames.forEach((name) => {
        const seriesData = message[name];

        // Keep only last MAX_DATA_POINTS if dataset is too large
        if (seriesData.length > MAX_DATA_POINTS) {
          dataBufferRef.current.set(name, seriesData.slice(-MAX_DATA_POINTS));
        } else {
          dataBufferRef.current.set(name, seriesData);
        }
      });

      // Throttle updates for performance
      if (!isPaused) {
        const now = Date.now();
        if (now - lastUpdateRef.current >= throttleDelay) {
          updateSeries();
          lastUpdateRef.current = now;
        }
      }
    },
    [isPaused, updateSeries]
  );

  const clearData = useCallback(() => {
    dataBufferRef.current.clear();
    setSeries([]);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPaused = !prev;
      // If unpausing, update the chart with buffered data
      if (!newPaused) {
        updateSeries();
      }
      return newPaused;
    });
  }, [updateSeries]);

  // Force update when unpausing
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        updateSeries();
      }, throttleDelay);

      return () => clearInterval(interval);
    }
  }, [isPaused, updateSeries]);

  return {
    series,
    addDataPoint,
    clearData,
    isPaused,
    togglePause,
  };
}
