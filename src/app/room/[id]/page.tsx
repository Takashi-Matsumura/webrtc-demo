'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceCall } from '@/components/VoiceCall';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-900">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium">戻る</span>
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          音声通話ルーム
        </h1>
        <div className="w-16" /> {/* スペーサー */}
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 p-4">
        <div className="h-full max-w-6xl mx-auto">
          <VoiceCall roomId={roomId} />
        </div>
      </main>
    </div>
  );
}
