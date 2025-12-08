import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

// 開発時はlocalhostまたはngrok URLを使用
// 本番環境ではサーバーのURLに変更
const getSignalingServerUrl = (): string => {
  try {
    const url = process.env.EXPO_PUBLIC_SIGNALING_SERVER_URL;
    if (url && url.length > 0) {
      console.log('[Socket] Using signaling server:', url);
      return url;
    }
    console.warn('[Socket] EXPO_PUBLIC_SIGNALING_SERVER_URL not set, using default');
    return 'http://localhost:3001';
  } catch (error) {
    console.error('[Socket] Error getting signaling server URL:', error);
    return 'http://localhost:3001';
  }
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    try {
      const url = getSignalingServerUrl();
      socket = io(url, {
        autoConnect: false,
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
      });
    } catch (error) {
      console.error('[Socket] Failed to initialize socket:', error);
      throw error;
    }
  }
  return socket;
};

export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
