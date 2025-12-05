import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@llm_settings';

export interface LLMSettings {
  url: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: LLMSettings = {
  url: 'http://localhost:11434/v1', // Ollama default
  apiKey: '',
  model: 'llama3.2',
  enabled: true,
};

interface UseLLMSettingsReturn {
  settings: LLMSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<LLMSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useLLMSettings = (): UseLLMSettingsReturn => {
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as LLMSettings;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.log('Failed to load LLM settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 設定を更新
  const updateSettings = useCallback(async (newSettings: Partial<LLMSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.log('Failed to save LLM settings:', error);
      throw error;
    }
  }, [settings]);

  // 設定をリセット
  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.log('Failed to reset LLM settings:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };
};
