# WebRTC 音声通話アプリ

2台のブラウザ間でリアルタイム音声通話ができ、会話内容を自動で文字起こしするWebアプリです。

## 機能

- **ルーム機能**: ルームIDを生成・共有して2人まで参加可能
- **音声通話**: WebRTCによるP2P音声ストリーミング
- **ミュート**: マイクのオン/オフ切り替え
- **文字起こし**: Web Speech APIによるリアルタイム音声認識（日本語対応）
- **音声レベル表示**: マイク入力のインジケーター

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- WebRTC (ネイティブAPI)
- Socket.io (シグナリング)
- Web Speech API (音声認識)
- Tailwind CSS

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## 使い方

1. ブラウザで http://localhost:3000 を開く
2. 「新しいルームを作成」をクリック
3. 生成されたルームIDを相手に共有
4. 相手がルームIDを入力して参加
5. 「通話開始」ボタンで通話スタート

## テスト方法

同一PCで2つのブラウザタブを開いてテスト可能です。

## ブラウザ対応

- **推奨**: Chrome（Web Speech API完全対応）
- マイクへのアクセス許可が必要

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ホーム（ルーム作成/参加）
│   └── room/[id]/page.tsx # 通話ルーム
├── components/            # UIコンポーネント
├── hooks/                 # カスタムフック
│   ├── useSocket.ts      # Socket.io接続
│   ├── useWebRTC.ts      # WebRTC管理
│   └── useSpeechRecognition.ts # 音声認識
├── lib/                   # ユーティリティ
└── types/                 # 型定義

server.js                  # Socket.ioサーバー
```
