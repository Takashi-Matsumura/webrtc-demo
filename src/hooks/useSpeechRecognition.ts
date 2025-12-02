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

  // ブラウザサポートチェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // 認識結果の処理
  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
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
            speaker: 'local',
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
          speaker: 'local',
          text: transcript,
          timestamp: new Date(),
          isFinal: false,
        },
      ];
    });
  }, []);

  // 音声認識の初期化
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      // 'no-speech' と 'aborted' は無視（正常な動作の一部）
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // continuous modeでは自動再起動
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          // 既に開始されている場合のエラーは無視
          if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
            console.error('Failed to restart recognition:', error);
          }
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    return recognition;
  }, [continuous, interimResults, language, handleResult]);

  // 音声認識開始
  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (error) {
        // 既に開始されている場合のエラーは無視
        if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
          console.error('Failed to start recognition:', error);
        }
      }
    }
  }, [isSupported, initializeRecognition]);

  // 音声認識停止
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      currentTranscriptIdRef.current = null;
    }
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
