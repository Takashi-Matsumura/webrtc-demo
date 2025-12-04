import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            style={[styles.iconButton, styles.startButton]}
            onPress={onStartCall}
          >
            <Ionicons name="call" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.iconButton, isMuted ? styles.mutedButton : styles.muteButton]}
              onPress={onToggleMute}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.endButton]}
              onPress={onEndCall}
            >
              <Ionicons name="call" size={32} color="#fff" style={styles.endCallIcon} />
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
    gap: 20,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
