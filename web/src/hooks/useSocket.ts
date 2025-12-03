'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { ClientToServerEvents, ServerToClientEvents } from '@/types';

interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendOffer: (roomId: string, targetUserId: string, offer: RTCSessionDescriptionInit) => void;
  sendAnswer: (roomId: string, targetUserId: string, answer: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (roomId: string, targetUserId: string, candidate: RTCIceCandidateInit) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;
    setSocket(s);

    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      disconnectSocket();
    };
  }, []);

  const createRoom = useCallback(() => {
    socketRef.current?.emit('create-room');
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  const sendOffer = useCallback(
    (roomId: string, targetUserId: string, offer: RTCSessionDescriptionInit) => {
      socketRef.current?.emit('offer', { roomId, targetUserId, offer });
    },
    []
  );

  const sendAnswer = useCallback(
    (roomId: string, targetUserId: string, answer: RTCSessionDescriptionInit) => {
      socketRef.current?.emit('answer', { roomId, targetUserId, answer });
    },
    []
  );

  const sendIceCandidate = useCallback(
    (roomId: string, targetUserId: string, candidate: RTCIceCandidateInit) => {
      socketRef.current?.emit('ice-candidate', { roomId, targetUserId, candidate });
    },
    []
  );

  return {
    socket,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
};
