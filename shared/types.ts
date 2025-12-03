// 共有型定義（Web, Mobile, Server間で共通）

// 通話状態の型定義
export type CallState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// 文字起こしエントリの型定義
export interface TranscriptEntry {
  id: string;
  speaker: 'local' | 'remote';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// ルーム情報の型定義
export interface RoomInfo {
  id: string;
  participants: string[];
  createdAt: Date;
}

// Socket.ioサーバーからクライアントへのイベント
export interface ServerToClientEvents {
  'user-joined': (userId: string) => void;
  'user-left': (userId: string) => void;
  'offer': (data: { userId: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { userId: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { userId: string; candidate: RTCIceCandidateInit }) => void;
  'room-full': () => void;
  'room-created': (roomId: string) => void;
  'room-joined': (data: { roomId: string; participants: string[] }) => void;
  'error': (message: string) => void;
}

// Socket.ioクライアントからサーバーへのイベント
export interface ClientToServerEvents {
  'create-room': () => void;
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'offer': (data: { roomId: string; targetUserId: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { roomId: string; targetUserId: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { roomId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => void;
}
