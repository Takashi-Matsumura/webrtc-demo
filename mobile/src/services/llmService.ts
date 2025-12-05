import { LLMSettings } from '../hooks/useLLMSettings';
import { TranscriptEntry } from '../types';

export interface SummarizeResult {
  success: boolean;
  summary?: string;
  error?: string;
}

// 文字起こしを会話ログ形式にフォーマット
export const formatTranscriptsForLLM = (transcripts: TranscriptEntry[]): string => {
  return transcripts
    .map((t) => {
      const speaker = t.speaker === 'local' ? 'あなた' : '相手';
      return `${speaker}: ${t.text}`;
    })
    .join('\n');
};

// LLMで要約を生成
export const summarizeTranscripts = async (
  transcripts: TranscriptEntry[],
  settings: LLMSettings
): Promise<SummarizeResult> => {
  if (!settings.enabled) {
    return { success: false, error: 'AI要約機能が無効です' };
  }

  if (transcripts.length === 0) {
    return { success: false, error: '文字起こしデータがありません' };
  }

  const conversationLog = formatTranscriptsForLLM(transcripts);

  const systemPrompt = `あなたは会話の要約を作成するアシスタントです。
以下の通話内容を日本語で簡潔に要約してください。
- 主要なトピックや決定事項を箇条書きで
- 重要なアクションアイテムがあれば明記
- 簡潔で分かりやすい表現を使用`;

  const userPrompt = `【通話ログ】
${conversationLog}

上記の通話内容を要約してください。`;

  try {
    // OpenAI互換APIエンドポイント
    const endpoint = settings.url.endsWith('/v1')
      ? `${settings.url}/chat/completions`
      : `${settings.url}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` }),
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('LLM API error:', errorText);
      return {
        success: false,
        error: `API エラー (${response.status}): ${response.statusText}`,
      };
    }

    const data = await response.json();

    // OpenAI互換レスポンス形式
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      return { success: false, error: 'レスポンスから要約を取得できませんでした' };
    }

    return { success: true, summary };
  } catch (error: any) {
    console.log('LLM summarize error:', error);
    return {
      success: false,
      error: error.message || 'LLMサーバーへの接続に失敗しました',
    };
  }
};
