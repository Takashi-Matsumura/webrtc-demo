'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TranscriptEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UseSpeechRecognitionProps {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcripts: TranscriptEntry[];
  startListening: () => void;
  stopListening: () => void;
  addRemoteTranscript: (text: string, isFinal: boolean) => void;
  clearTranscripts: () => void;
}

export const useSpeechRecognition = ({
  language = 'ja-JP',
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptIdRef = useRef<string | null>(null);
  const isListeningRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 設定をrefで保持（依存配列を安定させるため）
  const configRef = useRef({ language, continuous, interimResults });
  configRef.current = { language, continuous, interimResults };

  // ブラウザサポートチェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // 認識結果の処理（refで保持してcallbackを安定化）
  const handleResultRef = useRef((event: SpeechRecognitionEvent) => {
    const results = event.results;
    const lastResult = results[results.length - 1];
    const transcript = lastResult[0].transcript;
    const isFinal = lastResult.isFinal;

    setTranscripts((prev) => {
      // 中間結果の更新
      if (currentTranscriptIdRef.current && !isFinal) {
        return prev.map((t) =>
          t.id === currentTranscriptIdRef.current ? { ...t, text: transcript, isFinal: false } : t
        );
      }

      // 確定結果
      if (isFinal) {
        if (currentTranscriptIdRef.current) {
          const updated = prev.map((t) =>
            t.id === currentTranscriptIdRef.current ? { ...t, text: transcript, isFinal: true } : t
          );
          currentTranscriptIdRef.current = null;
          return updated;
        }
        // 新規確定結果
        return [
          ...prev,
          {
            id: uuidv4(),
            speaker: 'local' as const,
            text: transcript,
            timestamp: new Date(),
            isFinal: true,
          },
        ];
      }

      // 新規中間結果
      const newId = uuidv4();
      currentTranscriptIdRef.current = newId;
      return [
        ...prev,
        {
          id: newId,
          speaker: 'local' as const,
          text: transcript,
          timestamp: new Date(),
          isFinal: false,
        },
      ];
    });
  });

  // 音声認識の初期化
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    console.log('[SpeechRecognition] Initializing...');
    const recognition = new SpeechRecognition();
    const config = configRef.current;
    recognition.continuous = config.continuous;
    recognition.interimResults = config.interimResults;
    recognition.lang = config.language;

    recognition.onresult = (event) => handleResultRef.current(event);

    recognition.onerror = (event) => {
      console.log('[SpeechRecognition] Error:', event.error);

      // 'no-speech' と 'aborted' は無視（正常な動作の一部）
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      // 'network' エラーは一時的な問題の可能性があるのでリトライ
      if (event.error === 'network') {
        console.warn('[SpeechRecognition] Network error, will retry on next restart');
        // onendで自動リトライされるのでここでは状態をリセットしない
        return;
      }

      // 'not-allowed' はマイク権限の問題
      if (event.error === 'not-allowed') {
        console.warn('音声認識: マイクへのアクセスが許可されていません。');
      } else {
        console.error('Speech recognition error:', event.error);
      }

      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current = null;
      isInitializedRef.current = false;
    };

    recognition.onend = () => {
      console.log('[SpeechRecognition] onend - isListeningRef:', isListeningRef.current);

      // continuous modeでは自動再起動
      if (isListeningRef.current) {
        console.log('[SpeechRecognition] Restarting...');
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log('[SpeechRecognition] Restarted successfully');
            } catch (error) {
              console.error('[SpeechRecognition] Failed to restart:', error);
              setIsListening(false);
              isListeningRef.current = false;
            }
          }
        }, 100); // 少し待ってから再起動
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onstart = () => {
      console.log('[SpeechRecognition] Started');
    };

    recognitionRef.current = recognition;
    isInitializedRef.current = true;
    return recognition;
  }, []); // 依存配列を空に

  // 音声認識開始（安定したコールバック）
  const startListening = useCallback(() => {
    console.log('[SpeechRecognition] startListening called, isSupported:', isSupported);

    if (!isSupported) {
      console.warn('Speech recognition is not supported');
      return;
    }

    // 既にリスニング中なら何もしない
    if (isListeningRef.current) {
      console.log('[SpeechRecognition] Already listening, skipping');
      return;
    }

    const recognition = initializeRecognition();
    if (!recognition) {
      console.error('[SpeechRecognition] Failed to initialize');
      return;
    }

    try {
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
      console.log('[SpeechRecognition] Started listening');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        // 既に開始されている場合は状態を同期
        console.log('[SpeechRecognition] Already started (InvalidStateError)');
        setIsListening(true);
        isListeningRef.current = true;
      } else {
        console.error('[SpeechRecognition] Failed to start:', error);
        recognitionRef.current = null;
        isInitializedRef.current = false;
      }
    }
  }, [isSupported, initializeRecognition]);

  // 音声認識停止
  const stopListening = useCallback(() => {
    console.log('[SpeechRecognition] stopListening called');
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('[SpeechRecognition] Stop error (ignored):', error);
      }
    }

    setIsListening(false);
    currentTranscriptIdRef.current = null;
  }, []);

  // リモートの文字起こしを追加
  const addRemoteTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscripts((prev) => [
      ...prev,
      {
        id: uuidv4(),
        speaker: 'remote',
        text,
        timestamp: new Date(),
        isFinal,
      },
    ]);
  }, []);

  // 文字起こし履歴をクリア
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      console.log('[SpeechRecognition] Cleanup');
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcripts,
    startListening,
    stopListening,
    addRemoteTranscript,
    clearTranscripts,
  };
};
