import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLLMSettings } from '../src/hooks/useLLMSettings';

// プリセット設定
const PRESETS = [
  { name: 'Ollama (ローカル)', url: 'http://localhost:11434/v1', model: 'llama3.2' },
  { name: 'LM Studio', url: 'http://localhost:1234/v1', model: 'local-model' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'Claude (Anthropic)', url: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, resetSettings } = useLLMSettings();

  const [url, setUrl] = useState(settings.url);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [isSaving, setIsSaving] = useState(false);

  // 設定が読み込まれたら反映
  React.useEffect(() => {
    if (!isLoading) {
      setUrl(settings.url);
      setApiKey(settings.apiKey);
      setModel(settings.model);
      setEnabled(settings.enabled);
    }
  }, [isLoading, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ url, apiKey, model, enabled });
      Alert.alert('保存完了', '設定を保存しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'リセット確認',
      'すべての設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('リセット完了', 'デフォルト設定に戻しました');
          },
        },
      ]
    );
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setUrl(preset.url);
    setModel(preset.model);
  };

  const testConnection = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${url}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const modelCount = data.data?.length || 0;
        Alert.alert('接続成功', `${modelCount}個のモデルが利用可能です`);
      } else {
        Alert.alert('接続失敗', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      Alert.alert('接続エラー', error.message || 'サーバーに接続できませんでした');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* AI要約の有効/無効 */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.sectionTitle}>AI要約機能</Text>
              <Text style={styles.description}>通話終了後にAIで要約を生成</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={enabled ? '#3b82f6' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* プリセット選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プリセット</Text>
          <View style={styles.presetsContainer}>
            {PRESETS.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => applyPreset(preset)}
              >
                <Text style={styles.presetText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LLM URL */}
        <View style={styles.section}>
          <Text style={styles.label}>LLMサーバーURL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://localhost:11434/v1"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Ollama: http://192.168.x.x:11434/v1
          </Text>
        </View>

        {/* API Key */}
        <View style={styles.section}>
          <Text style={styles.label}>APIキー (オプション)</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>
            ローカルLLMでは不要です
          </Text>
        </View>

        {/* Model */}
        <View style={styles.section}>
          <Text style={styles.label}>モデル名</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="llama3.2"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            例: llama3.2, gemma2, gpt-4o-mini
          </Text>
        </View>

        {/* アクションボタン */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testConnection}
            disabled={isSaving}
          >
            <Text style={styles.testButtonText}>接続テスト</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={isSaving}
          >
            <Text style={styles.resetButtonText}>リセット</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 14,
    color: '#374151',
  },
  buttonSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  testButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
