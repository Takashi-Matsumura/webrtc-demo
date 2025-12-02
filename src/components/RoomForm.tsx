'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoomFormProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  createdRoomId: string | null;
}

export const RoomForm = ({ onCreateRoom, onJoinRoom, createdRoomId }: RoomFormProps) => {
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const router = useRouter();

  const handleCreateRoom = () => {
    onCreateRoom();
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  const handleEnterRoom = () => {
    if (createdRoomId) {
      router.push(`/room/${createdRoomId}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* タブ切り替え */}
      <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            mode === 'create'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          ルーム作成
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            mode === 'join'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          ルーム参加
        </button>
      </div>

      {/* ルーム作成モード */}
      {mode === 'create' && (
        <div className="space-y-4">
          {!createdRoomId ? (
            <button
              onClick={handleCreateRoom}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              新しいルームを作成
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  ルームが作成されました！
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-green-700 dark:text-green-300">
                    {createdRoomId}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdRoomId)}
                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                    title="コピー"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={handleEnterRoom}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                ルームに入室
              </button>
            </div>
          )}
        </div>
      )}

      {/* ルーム参加モード */}
      {mode === 'join' && (
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              ルームID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ルームIDを入力"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            参加する
          </button>
        </form>
      )}
    </div>
  );
};
