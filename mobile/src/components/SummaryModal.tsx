import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import { TranscriptEntry } from '../types';
import { LLMSettings } from '../hooks/useLLMSettings';
import { summarizeTranscripts } from '../services/llmService';

interface SummaryModalProps {
  visible: boolean;
  onClose: () => void;
  transcripts: TranscriptEntry[];
  settings: LLMSettings;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  visible,
  onClose,
  transcripts,
  settings,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    const result = await summarizeTranscripts(transcripts, settings);

    setIsLoading(false);

    if (result.success && result.summary) {
      setSummary(result.summary);
    } else {
      setError(result.error || '要約の生成に失敗しました');
    }
  };

  const handleCopy = () => {
    if (summary) {
      Clipboard.setString(summary);
      Alert.alert('コピーしました', '要約をクリップボードにコピーしました');
    }
  };

  const handleClose = () => {
    setSummary(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>通話終了</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!summary && !error && !isLoading && (
              <>
                <Text style={styles.message}>
                  通話お疲れさまでした。
                </Text>
                <Text style={styles.subMessage}>
                  文字起こし: {transcripts.length}件
                </Text>

                {settings.enabled ? (
                  <TouchableOpacity
                    style={styles.summarizeButton}
                    onPress={handleSummarize}
                  >
                    <Text style={styles.summarizeButtonText}>
                      AIで要約する
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.disabledNotice}>
                    <Text style={styles.disabledText}>
                      AI要約機能が無効です
                    </Text>
                    <Text style={styles.disabledHint}>
                      設定画面で有効にしてください
                    </Text>
                  </View>
                )}
              </>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>要約を生成中...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>エラー</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleSummarize}
                >
                  <Text style={styles.retryButtonText}>再試行</Text>
                </TouchableOpacity>
              </View>
            )}

            {summary && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>要約結果</Text>
                <ScrollView style={styles.summaryScroll}>
                  <Text style={styles.summaryText}>{summary}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                  <Text style={styles.copyButtonText}>コピー</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  content: {
    padding: 20,
    minHeight: 200,
  },
  message: {
    fontSize: 18,
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  summarizeButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summarizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledNotice: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  disabledHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  summaryScroll: {
    maxHeight: 300,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  summaryText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  copyButton: {
    marginTop: 12,
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    marginHorizontal: 20,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
