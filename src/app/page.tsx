'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomForm } from '@/components/RoomForm';
import { useSocket } from '@/hooks/useSocket';

export default function Home() {
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { socket, isConnected, createRoom, joinRoom } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (roomId: string) => {
      setCreatedRoomId(roomId);
      setError(null);
    };

    const handleRoomJoined = (data: { roomId: string; participants: string[] }) => {
      router.push(`/room/${data.roomId}`);
    };

    const handleRoomFull = () => {
      setError('ルームが満員です（最大2名）');
    };

    const handleError = (message: string) => {
      setError(message);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('room-full', handleRoomFull);
    socket.on('error', handleError);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-full', handleRoomFull);
      socket.off('error', handleError);
    };
  }, [socket, router]);

  const handleCreateRoom = () => {
    setError(null);
    createRoom();
  };

  const handleJoinRoom = (roomId: string) => {
    setError(null);
    joinRoom(roomId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            音声通話
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            WebRTCでリアルタイム音声通話
          </p>
        </div>

        {/* 接続状態 */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {isConnected ? 'サーバー接続済み' : '接続中...'}
            </span>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ルームフォーム */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
          <RoomForm
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            createdRoomId={createdRoomId}
          />
        </div>

        {/* 使い方 */}
        <div className="mt-8 text-center">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            使い方
          </h2>
          <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <p>1. 「新しいルームを作成」をクリック</p>
            <p>2. 生成されたルームIDを相手に共有</p>
            <p>3. 相手がルームIDで参加</p>
            <p>4. 通話開始ボタンで通話スタート</p>
          </div>
        </div>
      </div>
    </div>
  );
}
