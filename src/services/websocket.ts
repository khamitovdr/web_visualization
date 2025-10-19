export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketMessage {
  [seriesName: string]: Array<[number, number]>; // seriesName -> [[timestamp, value], ...]
}

export interface WebSocketCallbacks {
  onMessage: (data: WebSocketMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private callbacks: WebSocketCallbacks | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;
  private shouldReconnect: boolean = false;

  connect(url: string, callbacks: WebSocketCallbacks): void {
    this.url = url;
    this.callbacks = callbacks;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  private createConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.callbacks?.onStatusChange('connecting');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.callbacks?.onStatusChange('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;

          // Validate that we have at least one series with data
          const seriesNames = Object.keys(data);
          if (seriesNames.length > 0 && Array.isArray(data[seriesNames[0]])) {
            this.callbacks?.onMessage(data);
          } else {
            console.warn('Invalid message format: expected series arrays', data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.callbacks?.onError('Failed to parse message');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.callbacks?.onStatusChange('error');
        this.callbacks?.onError('WebSocket connection error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.callbacks?.onStatusChange('disconnected');
        this.ws = null;

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.callbacks?.onStatusChange('error');
      this.callbacks?.onError('Failed to create connection');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 16000);
    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.callbacks?.onStatusChange('disconnected');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
