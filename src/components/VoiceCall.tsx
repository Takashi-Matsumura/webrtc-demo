'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AudioControls } from './AudioControls';
import { Transcription } from './Transcription';

interface VoiceCallProps {
  roomId: string;
}

export const VoiceCall = ({ roomId }: VoiceCallProps) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();
  const {
    localStream,
    remoteStream,
    callState,
    isMuted,
    audioLevel,
    startCall,
    endCall,
    toggleMute,
  } = useWebRTC({ socket, roomId });

  const {
    isSupported,
    isListening,
    transcripts,
    startListening,
    stopListening,
    clearTranscripts,
  } = useSpeechRecognition();

  const audioRef = useRef<HTMLAudioElement>(null);

  // ルームに参加
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
    }

    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // リモートオーディオの再生
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 通話開始時に音声認識も開始
  const handleStartCall = async () => {
    await startCall();
    if (isSupported) {
      startListening();
    }
  };

  // 通話終了時に音声認識も停止
  const handleEndCall = () => {
    endCall();
    stopListening();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      {/* メインエリア: 通話コントロール */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-800 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            音声通話
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ルームID: <span className="font-mono font-medium">{roomId}</span>
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            IDをコピー
          </button>
        </div>

        {/* 接続状態 */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {isConnected ? 'サーバー接続済み' : 'サーバー未接続'}
            </span>
          </div>
        </div>

        {/* オーディオコントロール */}
        <AudioControls
          callState={callState}
          isMuted={isMuted}
          audioLevel={audioLevel}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
        />

        {/* 非サポートブラウザの警告 */}
        {!isSupported && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              このブラウザは音声認識をサポートしていません。Chrome の使用を推奨します。
            </p>
          </div>
        )}

        {/* 隠しオーディオ要素 */}
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      </div>

      {/* サイドエリア: 文字起こし */}
      <div className="lg:w-96 h-80 lg:h-full bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
        <Transcription
          transcripts={transcripts}
          isListening={isListening}
          onStartListening={startListening}
          onStopListening={stopListening}
          onClear={clearTranscripts}
        />
      </div>
    </div>
  );
};
