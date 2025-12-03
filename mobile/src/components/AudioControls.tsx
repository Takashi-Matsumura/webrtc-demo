import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CallState } from '../types';

interface AudioControlsProps {
  callState: CallState;
  isMuted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  callState,
  isMuted,
  onStartCall,
  onEndCall,
  onToggleMute,
}) => {
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
        return 'エラー';
      default:
        return '';
    }
  };

  const isCallActive = callState === 'connecting' || callState === 'connected';

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{getStatusText()}</Text>

      <View style={styles.buttons}>
        {!isCallActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={onStartCall}
          >
            <Text style={styles.buttonText}>通話開始</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, isMuted ? styles.mutedButton : styles.muteButton]}
              onPress={onToggleMute}
            >
              <Text style={styles.buttonText}>
                {isMuted ? 'ミュート解除' : 'ミュート'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.endButton]}
              onPress={onEndCall}
            >
              <Text style={styles.buttonText}>終了</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  muteButton: {
    backgroundColor: '#6b7280',
  },
  mutedButton: {
    backgroundColor: '#f59e0b',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
