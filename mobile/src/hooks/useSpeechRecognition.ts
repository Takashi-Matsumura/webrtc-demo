import { useEffect, useState, useCallback, useRef } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { TranscriptEntry } from '../types';

// Simple ID generator for React Native (uuid requires crypto polyfill)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 無音検出のタイムアウト（ミリ秒）
const SILENCE_TIMEOUT_MS = 2000;

interface UseSpeechRecognitionProps {
  language?: string;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcripts: TranscriptEntry[];
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  addRemoteTranscript: (text: string, isFinal: boolean) => void;
  clearTranscripts: () => void;
}

export const useSpeechRecognition = ({
  language = 'ja-JP',
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn => {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const currentTranscriptIdRef = useRef<string | null>(null);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 確定済みテキストの長さを追跡（新しいテキストのみを抽出するため）
  const lastFinalizedTextLengthRef = useRef(0);

  // 無音タイマーをリセット
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // 音声認識を再起動するヘルパー関数
  const restartRecognition = useCallback(async (retryCount = 0) => {
    if (!isListeningRef.current) return;

    const maxRetries = 3;
    const delay = 300 + retryCount * 200;

    try {
      await Voice.stop().catch(() => {});
      await Voice.cancel().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!isListeningRef.current) return;

      await Voice.start(language);
      console.log('Speech recognition restarted successfully');
    } catch (error) {
      console.log(`Speech recognition restart failed (attempt ${retryCount + 1}):`, error);

      if (retryCount < maxRetries && isListeningRef.current) {
        setTimeout(() => restartRecognition(retryCount + 1), delay);
      }
    }
  }, [language]);

  // 無音タイマーを開始
  const startSilenceTimer = useCallback(() => {
    resetSilenceTimer();

    if (!isListeningRef.current) return;

    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current && currentTranscriptIdRef.current) {
        console.log('Silence detected, finalizing current session...');

        // 現在のセッションをfinalにする
        setTranscripts((prev) => {
          const current = prev.find(t => t.id === currentTranscriptIdRef.current);
          if (current) {
            // 累積長を更新（置き換えではなく加算）
            lastFinalizedTextLengthRef.current += current.text.length;
            console.log('Finalized text length (累積):', lastFinalizedTextLengthRef.current);
          }
          return prev.map((t) =>
            t.id === currentTranscriptIdRef.current
              ? { ...t, isFinal: true }
              : t
          );
        });

        // 新しいセッション用にIDをリセット
        currentTranscriptIdRef.current = null;
        console.log('Session finalized, ready for new input');
      }
    }, SILENCE_TIMEOUT_MS);
  }, [resetSilenceTimer]);

  // テキストから新しい部分のみを抽出
  const extractNewText = useCallback((fullText: string): string => {
    if (lastFinalizedTextLengthRef.current === 0) {
      return fullText;
    }
    // 累積テキストから既に確定した部分を除去
    const newText = fullText.substring(lastFinalizedTextLengthRef.current).trim();
    return newText || fullText; // 新しいテキストがなければ全体を返す（フォールバック）
  }, []);

  // 音声認識結果のハンドラ
  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    if (!isListeningRef.current) return;

    const results = event.value;
    if (!results || results.length === 0) return;

    const fullTranscript = results[0];
    const transcript = extractNewText(fullTranscript);

    // 空のテキストは無視
    if (!transcript.trim()) return;

    setTranscripts((prev) => {
      if (currentTranscriptIdRef.current) {
        return prev.map((t) =>
          t.id === currentTranscriptIdRef.current
            ? { ...t, text: transcript, isFinal: true }
            : t
        );
      }

      const newId = generateId();
      currentTranscriptIdRef.current = newId;
      return [
        ...prev,
        {
          id: newId,
          speaker: 'local' as const,
          text: transcript,
          timestamp: new Date(),
          isFinal: true,
        },
      ];
    });

    startSilenceTimer();
  }, [startSilenceTimer, extractNewText]);

  // 部分的な結果のハンドラ
  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    if (!isListeningRef.current) return;

    const results = event.value;
    if (!results || results.length === 0) return;

    const fullTranscript = results[0];
    const transcript = extractNewText(fullTranscript);

    // 空のテキストは無視
    if (!transcript.trim()) return;

    setTranscripts((prev) => {
      if (currentTranscriptIdRef.current) {
        return prev.map((t) =>
          t.id === currentTranscriptIdRef.current
            ? { ...t, text: transcript, isFinal: false }
            : t
        );
      }

      const newId = generateId();
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

    startSilenceTimer();
  }, [startSilenceTimer, extractNewText]);

  // エラーハンドラ
  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    console.log('Speech recognition error:', event.error);
    if (isListeningRef.current) {
      restartRecognition(0);
    }
  }, [restartRecognition]);

  // 開始ハンドラ
  const onSpeechStart = useCallback(() => {
    console.log('Speech recognition session started (onSpeechStart)');
    startSilenceTimer();
  }, [startSilenceTimer]);

  // 終了ハンドラ（自動再起動）
  const onSpeechEnd = useCallback(() => {
    console.log('Speech recognition ended');
    currentTranscriptIdRef.current = null;

    if (isListeningRef.current) {
      console.log('Auto-restarting speech recognition...');
      // onSpeechEndで再起動する場合、テキストバッファがリセットされる
      lastFinalizedTextLengthRef.current = 0;
      restartRecognition(0);
    }
  }, [restartRecognition]);

  // イベントリスナーの設定
  useEffect(() => {
    let mounted = true;

    const initVoice = async () => {
      try {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechEnd = onSpeechEnd;

        const available = await Voice.isAvailable();
        if (mounted) {
          setIsSupported(!!available);
        }
      } catch (error) {
        console.log('Voice initialization failed:', error);
        if (mounted) {
          setIsSupported(false);
        }
      }
    };

    initVoice();

    return () => {
      mounted = false;
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechError, onSpeechEnd]);

  // 音声認識開始
  const startListening = useCallback(async () => {
    if (!isSupported || isListeningRef.current) return;

    try {
      isListeningRef.current = true;
      setIsListening(true);
      lastFinalizedTextLengthRef.current = 0; // リセット
      await Voice.start(language);
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [isSupported, language]);

  // 音声認識停止
  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    setIsListening(false);
    currentTranscriptIdRef.current = null;
    lastFinalizedTextLengthRef.current = 0;
    resetSilenceTimer();

    try {
      await Voice.stop();
      console.log('Speech recognition stopped');
    } catch (error) {
      console.log('Stop error (ignored):', error);
    }
  }, [resetSilenceTimer]);

  // リモートの文字起こしを追加
  const addRemoteTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscripts((prev) => [
      ...prev,
      {
        id: generateId(),
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
    lastFinalizedTextLengthRef.current = 0;
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
