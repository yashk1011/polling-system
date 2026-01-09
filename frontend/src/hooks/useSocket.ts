import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Connection error. Please check your network.');
      setIsConnected(false);
    });

    socketInstance.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected. Cannot emit event:', event);
      }
    },
    [socket, isConnected]
  );

  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (socket) {
        socket.on(event, handler);
      }
    },
    [socket]
  );

  const off = useCallback(
    (event: string, handler?: (data: any) => void) => {
      if (socket) {
        if (handler) {
          socket.off(event, handler);
        } else {
          socket.off(event);
        }
      }
    },
    [socket]
  );

  return { socket, isConnected, error, emit, on, off };
};
