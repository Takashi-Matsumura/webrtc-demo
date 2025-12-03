import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TranscriptEntry } from '../types';

interface TranscriptionProps {
  transcripts: TranscriptEntry[];
  isListening: boolean;
  onClear: () => void;
}

export const Transcription: React.FC<TranscriptionProps> = ({
  transcripts,
  isListening,
  onClear,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [transcripts]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>文字起こし</Text>
          {isListening && (
            <View style={styles.listeningIndicator}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>認識中</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>クリア</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {transcripts.length === 0 ? (
          <Text style={styles.emptyText}>
            通話を開始すると、ここに文字起こしが表示されます
          </Text>
        ) : (
          transcripts.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.transcriptEntry,
                entry.speaker === 'local' ? styles.localEntry : styles.remoteEntry,
              ]}
            >
              <Text style={styles.speaker}>
                {entry.speaker === 'local' ? 'あなた' : '相手'}
              </Text>
              <Text
                style={[
                  styles.transcriptText,
                  !entry.isFinal && styles.interimText,
                ]}
              >
                {entry.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  listeningText: {
    fontSize: 12,
    color: '#ef4444',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  transcriptEntry: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  localEntry: {
    backgroundColor: '#dbeafe',
    alignSelf: 'flex-end',
  },
  remoteEntry: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  speaker: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  interimText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
