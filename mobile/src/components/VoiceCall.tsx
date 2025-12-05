import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLLMSettings } from '../hooks/useLLMSettings';
import { AudioControls } from './AudioControls';
import { Transcription } from './Transcription';
import { SummaryModal } from './SummaryModal';
import { TranscriptMessage } from '../types';

interface VoiceCallProps {
  roomId: string;
}

export const VoiceCall: React.FC<VoiceCallProps> = ({ roomId }) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();
  const { settings: llmSettings } = useLLMSettings();
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const {
    isSupported,
    isListening,
    transcripts,
    startListening,
    stopListening,
    addRemoteTranscript,
    clearTranscripts,
  } = useSpeechRecognition();

  // リモートからの文字起こしを受信したときのコールバック
  const handleRemoteTranscript = useCallback((message: TranscriptMessage) => {
    console.log('Received remote transcript:', message.text);
    addRemoteTranscript(message.text, message.isFinal);
  }, [addRemoteTranscript]);

  const {
    localStream,
    callState,
    isMuted,
    startCall,
    endCall,
    toggleMute,
    sendTranscript,
  } = useWebRTC({ socket, roomId, onRemoteTranscript: handleRemoteTranscript });

  const hasStartedListeningRef = useRef(false);
  const lastSentTranscriptRef = useRef<{ id: string; text: string } | null>(null);

  // ローカルの文字起こしが更新されたら相手に送信
  useEffect(() => {
    const localTranscripts = transcripts.filter(t => t.speaker === 'local');
    if (localTranscripts.length === 0) return;

    const latest = localTranscripts[localTranscripts.length - 1];

    // 同じ内容を重複送信しない
    if (
      lastSentTranscriptRef.current?.id === latest.id &&
      lastSentTranscriptRef.current?.text === latest.text
    ) {
      return;
    }

    lastSentTranscriptRef.current = { id: latest.id, text: latest.text };

    const message: TranscriptMessage = {
      type: 'transcript',
      id: latest.id,
      text: latest.text,
      isFinal: latest.isFinal,
      timestamp: latest.timestamp.toISOString(),
    };

    sendTranscript(message);
  }, [transcripts, sendTranscript]);

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

  // localStreamが取得できたら音声認識を開始
  useEffect(() => {
    if (localStream && isSupported && !hasStartedListeningRef.current) {
      hasStartedListeningRef.current = true;
      console.log('[VoiceCall] Starting speech recognition...');
      startListening();
    }
    if (!localStream) {
      hasStartedListeningRef.current = false;
    }
  }, [localStream, isSupported, startListening]);

  // 通話開始
  const handleStartCall = async () => {
    await startCall();
  };

  // 通話終了
  const handleEndCall = () => {
    endCall();
    stopListening();
    // 文字起こしがあれば要約モーダルを表示
    if (transcripts.length > 0) {
      setShowSummaryModal(true);
    }
  };

  // 要約モーダルを閉じる
  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
  };

  // ルームIDをコピー
  const handleCopyRoomId = () => {
    Clipboard.setString(roomId);
    Alert.alert('コピーしました', 'ルームIDをクリップボードにコピーしました');
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.statusDot,
              isConnected ? styles.connected : styles.disconnected,
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? '接続済み' : '未接続'}
          </Text>
        </View>

        <TouchableOpacity style={styles.roomIdContainer} onPress={handleCopyRoomId}>
          <Text style={styles.roomIdLabel}>ルームID:</Text>
          <Text style={styles.roomId}>{roomId}</Text>
          <Text style={styles.copyIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* 通話コントロール */}
      <View style={styles.controlsSection}>
        <AudioControls
          callState={callState}
          isMuted={isMuted}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
        />

        {!isSupported && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              このデバイスは音声認識をサポートしていません
            </Text>
          </View>
        )}
      </View>

      {/* 文字起こし */}
      <View style={styles.transcriptionSection}>
        <Transcription
          transcripts={transcripts}
          isListening={isListening}
          onClear={clearTranscripts}
        />
      </View>

      {/* 要約モーダル */}
      <SummaryModal
        visible={showSummaryModal}
        onClose={handleCloseSummaryModal}
        transcripts={transcripts}
        settings={llmSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#22c55e',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  roomIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomIdLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  roomId: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#111',
  },
  copyIcon: {
    fontSize: 14,
  },
  controlsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  transcriptionSection: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
