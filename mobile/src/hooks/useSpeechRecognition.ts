import { useEffect, useState, useCallback, useRef } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { TranscriptEntry } from '../types';

// Simple ID generator for React Native (uuid requires crypto polyfill)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  // 音声認識結果のハンドラ
  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const results = event.value;
    if (!results || results.length === 0) return;

    const transcript = results[0];

    setTranscripts((prev) => {
      // 中間結果の更新
      if (currentTranscriptIdRef.current) {
        return prev.map((t) =>
          t.id === currentTranscriptIdRef.current
            ? { ...t, text: transcript, isFinal: true }
            : t
        );
      }

      // 新規結果
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

    // 確定後はIDをリセット
    currentTranscriptIdRef.current = null;
  }, []);

  // 部分的な結果のハンドラ
  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const results = event.value;
    if (!results || results.length === 0) return;

    const transcript = results[0];

    setTranscripts((prev) => {
      // 既存の中間結果を更新
      if (currentTranscriptIdRef.current) {
        return prev.map((t) =>
          t.id === currentTranscriptIdRef.current
            ? { ...t, text: transcript, isFinal: false }
            : t
        );
      }

      // 新規中間結果
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
  }, []);

  // エラーハンドラ
  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    console.log('Speech recognition error:', event.error);
    // 自動リトライ
    if (isListeningRef.current) {
      setTimeout(() => {
        if (isListeningRef.current) {
          Voice.start(language).catch(console.error);
        }
      }, 100);
    }
  }, [language]);

  // 終了ハンドラ（自動再起動）
  const onSpeechEnd = useCallback(() => {
    console.log('Speech recognition ended');
    currentTranscriptIdRef.current = null;

    // continuous modeをエミュレート
    if (isListeningRef.current) {
      setTimeout(() => {
        if (isListeningRef.current) {
          Voice.start(language).catch(console.error);
        }
      }, 100);
    }
  }, [language]);

  // イベントリスナーの設定
  useEffect(() => {
    let mounted = true;

    const initVoice = async () => {
      try {
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechEnd = onSpeechEnd;

        // サポートチェック
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
  }, [onSpeechResults, onSpeechPartialResults, onSpeechError, onSpeechEnd]);

  // 音声認識開始
  const startListening = useCallback(async () => {
    if (!isSupported || isListeningRef.current) return;

    try {
      isListeningRef.current = true;
      setIsListening(true);
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

    try {
      await Voice.stop();
      console.log('Speech recognition stopped');
    } catch (error) {
      console.log('Stop error (ignored):', error);
    }
  }, []);

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
