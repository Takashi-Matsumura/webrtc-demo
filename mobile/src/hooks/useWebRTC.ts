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
import { CallState, ServerToClientEvents, ClientToServerEvents, TranscriptMessage } from '../types';

interface UseWebRTCProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
  onRemoteTranscript?: (message: TranscriptMessage) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callState: CallState;
  isMuted: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  sendTranscript: (message: TranscriptMessage) => void;
}

export const useWebRTC = ({ socket, roomId, onRemoteTranscript }: UseWebRTCProps): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const dataChannelRef = useRef<any>(null);
  const onRemoteTranscriptRef = useRef(onRemoteTranscript);

  // コールバック参照を最新に保つ
  useEffect(() => {
    onRemoteTranscriptRef.current = onRemoteTranscript;
  }, [onRemoteTranscript]);

  // DataChannelのセットアップ
  const setupDataChannel = useCallback((channel: any) => {
    channel.onopen = () => {
      console.log('DataChannel opened');
    };
    channel.onclose = () => {
      console.log('DataChannel closed');
    };
    channel.onmessage = (event: any) => {
      try {
        const message = JSON.parse(event.data) as TranscriptMessage;
        if (message.type === 'transcript' && onRemoteTranscriptRef.current) {
          onRemoteTranscriptRef.current(message);
        }
      } catch (error) {
        console.log('DataChannel message parse error:', error);
      }
    };
    dataChannelRef.current = channel;
  }, []);

  // 文字起こしを送信
  const sendTranscript = useCallback((message: TranscriptMessage) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(message));
    }
  }, []);

  // PeerConnectionの初期化
  const initializePeerConnection = useCallback((isInitiator: boolean = false) => {
    const pc = createPeerConnection();

    (pc as any).onicecandidate = (event: any) => {
      if (event.candidate && socket && remoteUserIdRef.current) {
        socket.emit('ice-candidate', {
          roomId,
          targetUserId: remoteUserIdRef.current,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    (pc as any).ontrack = (event: any) => {
      console.log('Remote track received');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    (pc as any).oniceconnectionstatechange = () => {
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

    // DataChannel: イニシエーター側が作成
    if (isInitiator) {
      const channel = pc.createDataChannel('transcripts');
      setupDataChannel(channel);
    }

    // DataChannel: 受信側はondatachannelで受け取る
    (pc as any).ondatachannel = (event: any) => {
      console.log('DataChannel received');
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, roomId, setupDataChannel]);

  // 通話開始
  const startCall = useCallback(async () => {
    try {
      setCallState('connecting');
      const stream = await getUserMedia();
      setLocalStream(stream);

      // イニシエーターとしてDataChannelを作成
      const pc = initializePeerConnection(true);
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
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
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
    sendTranscript,
  };
};
