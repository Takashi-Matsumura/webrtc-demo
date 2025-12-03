'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [showCopied, setShowCopied] = useState(false);

  // ルームIDをコピー
  const handleCopyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

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
    // 通話が成功した場合のみ音声認識を開始（localStreamがあれば成功）
  };

  // localStreamが取得できたら音声認識を開始
  const hasStartedListeningRef = useRef(false);
  useEffect(() => {
    if (localStream && isSupported && !hasStartedListeningRef.current) {
      hasStartedListeningRef.current = true;
      console.log('[VoiceCall] Starting speech recognition...');
      startListening();
    }
    // localStreamがなくなったらリセット
    if (!localStream) {
      hasStartedListeningRef.current = false;
    }
  }, [localStream, isSupported, startListening]);

  // 通話終了時に音声認識も停止
  const handleEndCall = () => {
    endCall();
    stopListening();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-4">
      {/* コンパクトな通話コントロールバー（モバイル用） */}
      <div className="lg:flex-1 flex flex-col bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-xl shadow-lg p-3 lg:p-8 lg:justify-center">
        {/* モバイル: 横並びのコンパクトレイアウト */}
        <div className="flex lg:flex-col items-center lg:items-center gap-3 lg:gap-6">
          {/* ルームID + 接続状態（横一列） */}
          <div className="flex-1 lg:flex-none lg:text-center">
            <div className="flex items-center gap-2 lg:justify-center">
              {/* 接続状態インジケーター */}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {/* ルームIDラベル + 値 */}
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ルームID:
              </span>
              <span className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
                {roomId}
              </span>
              {/* コピーボタン */}
              <div className="relative">
                <button
                  onClick={handleCopyRoomId}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="IDをコピー"
                >
                  {showCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                {/* コピー完了ツールチップ */}
                {showCopied && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 dark:bg-zinc-700 text-white text-xs rounded whitespace-nowrap z-10">
                    コピーしました
                  </div>
                )}
              </div>
            </div>
            {/* デスクトップ用: 接続状態テキスト */}
            <div className="hidden lg:block mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isConnected ? 'サーバー接続済み' : 'サーバー未接続'}
            </div>
          </div>

          {/* 通話コントロール */}
          <div className="flex items-center gap-2">
            <AudioControls
              callState={callState}
              isMuted={isMuted}
              audioLevel={audioLevel}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMute={toggleMute}
            />
          </div>
        </div>

        {/* デスクトップ用: 詳細表示 */}
        <div className="hidden lg:block mt-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 text-center">
            音声通話
          </h1>
          {/* 非サポートブラウザの警告 */}
          {!isSupported && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                このブラウザは音声認識をサポートしていません。Chrome の使用を推奨します。
              </p>
            </div>
          )}
        </div>

        {/* 隠しオーディオ要素 */}
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      </div>

      {/* 文字起こしエリア（メイン表示） */}
      <div className="lg:w-96 flex-1 lg:flex-none lg:h-full bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
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
