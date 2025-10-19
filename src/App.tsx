import { useState, useCallback, useEffect, useRef } from 'react';
import Chart from './components/Chart';
import Controls from './components/Controls';
import { WebSocketService, ConnectionStatus } from './services/websocket';
import { useRealtimeData } from './hooks/useRealtimeData';
import './App.css';

const DEFAULT_SERVER_URL = 'ws://localhost:8004';

function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState({ width: 800, height: 400 });
  
  const wsServiceRef = useRef<WebSocketService>(new WebSocketService());
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const { series, addDataPoint, clearData, isPaused, togglePause } = useRealtimeData();

  // Handle window resize for responsive chart
  useEffect(() => {
    const updateChartSize = () => {
      if (chartContainerRef.current) {
        const container = chartContainerRef.current;
        const width = container.clientWidth - 32; // Account for padding
        const height = Math.min(window.innerHeight - 250, 600);
        setChartSize({ width: Math.max(width, 300), height: Math.max(height, 300) });
      }
    };

    updateChartSize();
    window.addEventListener('resize', updateChartSize);
    
    // Small delay to ensure container is rendered
    setTimeout(updateChartSize, 100);

    return () => window.removeEventListener('resize', updateChartSize);
  }, []);

  const handleConnect = useCallback(() => {
    setError(null);
    
    wsServiceRef.current.connect(serverUrl, {
      onMessage: (data) => {
        addDataPoint(data);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
      onError: (errorMsg) => {
        setError(errorMsg);
      },
    });
  }, [serverUrl, addDataPoint]);

  const handleDisconnect = useCallback(() => {
    wsServiceRef.current.disconnect();
    setError(null);
  }, []);

  const handleServerUrlChange = useCallback((url: string) => {
    setServerUrl(url);
  }, []);

  const handleClear = useCallback(() => {
    clearData();
    setError(null);
  }, [clearData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsServiceRef.current.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Real-time Data Visualization</h1>
      </header>

      <main className="app-main">
        <Controls
          serverUrl={serverUrl}
          onServerUrlChange={handleServerUrlChange}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onClear={handleClear}
          onTogglePause={togglePause}
          isPaused={isPaused}
          connectionStatus={connectionStatus}
        />

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="chart-wrapper" ref={chartContainerRef}>
          <Chart series={series} width={chartSize.width} height={chartSize.height} />
        </div>

        {series.length === 0 && (
          <div className="info-message">
            Connect to a WebSocket server to start visualizing data
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

