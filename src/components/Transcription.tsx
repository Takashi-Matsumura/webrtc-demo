'use client';

import { useEffect, useRef } from 'react';
import { TranscriptEntry } from '@/types';

interface TranscriptionProps {
  transcripts: TranscriptEntry[];
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onClear: () => void;
}

export const Transcription = ({
  transcripts,
  isListening,
  onStartListening,
  onStopListening,
  onClear,
}: TranscriptionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しいトランスクリプトが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">文字起こし</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={isListening ? onStopListening : onStartListening}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isListening
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            {isListening ? '停止' : '開始'}
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            クリア
          </button>
        </div>
      </div>

      {/* 文字起こし表示エリア */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50"
      >
        {transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {isListening
                ? '音声を認識しています...'
                : '「開始」をクリックして文字起こしを開始してください'}
            </p>
          </div>
        ) : (
          transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className={`flex flex-col ${
                transcript.speaker === 'local' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  transcript.speaker === 'local'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md shadow-sm'
                } ${!transcript.isFinal ? 'opacity-70' : ''}`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{transcript.text}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 px-2">
                <span
                  className={`text-xs ${
                    transcript.speaker === 'local'
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {transcript.speaker === 'local' ? '自分' : '相手'}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatTime(transcript.timestamp)}
                </span>
                {!transcript.isFinal && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
                    認識中...
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ステータスバー */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isListening ? '音声認識中' : '停止中'}
            </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {transcripts.filter((t) => t.isFinal).length} 件の発言
          </span>
        </div>
      </div>
    </div>
  );
};
