import { type FormEvent, useId, useState } from 'react';
import type { ConnectionStatus } from '../services/websocket';

interface ControlsProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onClear: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  connectionStatus: ConnectionStatus;
}

export default function Controls({
  serverUrl,
  onServerUrlChange,
  onConnect,
  onDisconnect,
  onClear,
  onTogglePause,
  isPaused,
  connectionStatus,
}: ControlsProps) {
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const inputId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onServerUrlChange(inputUrl);
    if (connectionStatus === 'disconnected') {
      onConnect();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="controls">
      <div className="controls-row">
        <form onSubmit={handleSubmit} className="url-form">
          <label htmlFor={inputId}>Server Address:</label>
          <input
            id={inputId}
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            disabled={isConnected || isConnecting}
            placeholder="ws://localhost:8004"
          />
        </form>

        <div className="status">
          <span className="status-indicator" style={{ backgroundColor: getStatusColor() }} />
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      <div className="controls-row">
        <div className="button-group">
          {!isConnected && !isConnecting && (
            <button type="button" onClick={onConnect} className="btn btn-primary">
              Connect
            </button>
          )}
          {(isConnected || isConnecting) && (
            <button type="button" onClick={onDisconnect} className="btn btn-secondary">
              Disconnect
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePause}
            disabled={!isConnected}
            className="btn btn-secondary"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button type="button" onClick={onClear} className="btn btn-secondary">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
