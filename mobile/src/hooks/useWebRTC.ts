import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { RTCPeerConnection, MediaStream } from 'react-native-webrtc';
import {
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  getUserMedia,
} from '../lib/webrtc';
import { CallState, ServerToClientEvents, ClientToServerEvents } from '../types';

interface UseWebRTCProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callState: CallState;
  isMuted: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
}

export const useWebRTC = ({ socket, roomId }: UseWebRTCProps): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  // PeerConnectionの初期化
  const initializePeerConnection = useCallback(() => {
    const pc = createPeerConnection();

    pc.onicecandidate = (event: any) => {
      if (event.candidate && socket && remoteUserIdRef.current) {
        socket.emit('ice-candidate', {
          roomId,
          targetUserId: remoteUserIdRef.current,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event: any) => {
      console.log('Remote track received');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setCallState('connected');
          break;
        case 'disconnected':
        case 'failed':
        case 'closed':
          setCallState('disconnected');
          break;
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, roomId]);

  // 通話開始
  const startCall = useCallback(async () => {
    try {
      setCallState('connecting');
      const stream = await getUserMedia();
      setLocalStream(stream);

      const pc = initializePeerConnection();
      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      // 相手がすでにいる場合はオファーを送信
      if (remoteUserIdRef.current) {
        const offer = await createOffer(pc);
        socket?.emit('offer', {
          roomId,
          targetUserId: remoteUserIdRef.current,
          offer,
        });
      }
    } catch (error) {
      console.error('通話開始エラー:', error);
      setCallState('error');
    }
  }, [socket, roomId, initializePeerConnection]);

  // 通話終了
  const endCall = useCallback(() => {
    localStream?.getTracks().forEach((track: any) => track.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
  }, [localStream]);

  // ミュート切り替え
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // ソケットイベントのリスナー設定
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = async (userId: string) => {
      console.log('User joined:', userId);
      remoteUserIdRef.current = userId;

      if (localStream && peerConnectionRef.current) {
        const offer = await createOffer(peerConnectionRef.current);
        socket.emit('offer', {
          roomId,
          targetUserId: userId,
          offer,
        });
      }
    };

    const handleUserLeft = (userId: string) => {
      console.log('User left:', userId);
      if (remoteUserIdRef.current === userId) {
        remoteUserIdRef.current = null;
        setRemoteStream(null);
        setCallState('disconnected');
      }
    };

    const handleOffer = async (data: { userId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', data.userId);
      remoteUserIdRef.current = data.userId;

      if (!peerConnectionRef.current) {
        const pc = initializePeerConnection();
        if (localStream) {
          localStream.getTracks().forEach((track: any) => {
            pc.addTrack(track, localStream);
          });
        }
      }

      const pc = peerConnectionRef.current!;
      const answer = await createAnswer(pc, data.offer);
      socket.emit('answer', {
        roomId,
        targetUserId: data.userId,
        answer,
      });
    };

    const handleAnswer = async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Received answer from:', data.userId);
      if (peerConnectionRef.current) {
        await setRemoteDescription(peerConnectionRef.current, data.answer);
      }
    };

    const handleIceCandidate = async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await addIceCandidate(peerConnectionRef.current, data.candidate);
      }
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, roomId, localStream, initializePeerConnection]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    callState,
    isMuted,
    startCall,
    endCall,
    toggleMute,
  };
};
