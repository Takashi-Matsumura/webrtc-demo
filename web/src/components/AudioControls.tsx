'use client';

import { CallState } from '@/types';

interface AudioControlsProps {
  callState: CallState;
  isMuted: boolean;
  audioLevel: number;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}

export const AudioControls = ({
  callState,
  isMuted,
  audioLevel,
  onStartCall,
  onEndCall,
  onToggleMute,
}: AudioControlsProps) => {
  const getStatusText = () => {
    switch (callState) {
      case 'idle':
        return '待機中';
      case 'connecting':
        return '接続中...';
      case 'connected':
        return '通話中';
      case 'disconnected':
        return '切断されました';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (callState) {
      case 'idle':
        return 'bg-zinc-400';
      case 'connecting':
        return 'bg-yellow-400 animate-pulse';
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-zinc-400';
    }
  };

  return (
    <div className="flex items-center gap-2 lg:flex-col lg:gap-4">
      {/* 通話状態（モバイルでは非表示、デスクトップで表示） */}
      <div className="hidden lg:flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {getStatusText()}
        </span>
      </div>

      {/* 音声レベルインジケーター（デスクトップのみ） */}
      {callState === 'connected' && (
        <div className="hidden lg:block w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-75"
            style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
          />
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex items-center gap-3">
        {callState === 'idle' || callState === 'disconnected' ? (
          <button
            onClick={onStartCall}
            className="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full transition-colors shadow-lg"
            title="通話開始"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 lg:h-8 lg:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
        ) : (
          <>
            {/* 通話状態インジケーター（モバイル用・接続中のみ） */}
            {callState === 'connecting' && (
              <div className="lg:hidden flex items-center">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              </div>
            )}

            {/* ミュートボタン */}
            <button
              onClick={onToggleMute}
              className={`flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full transition-colors shadow-lg ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                  : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 text-zinc-700 dark:text-zinc-300'
              }`}
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    clipRule="evenodd"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>

            {/* 通話終了ボタン */}
            <button
              onClick={onEndCall}
              className="flex items-center justify-center w-14 h-14 lg:w-14 lg:h-14 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-lg"
              title="通話終了"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
