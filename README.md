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

## 異なるデバイス間でのテスト（ngrok）

PCとスマートフォンなど、異なるデバイス間でテストする場合は、ngrokを使用してローカルサーバーを外部公開できます。

### ngrokとは

ngrokは、ローカルで動作しているWebサーバーを一時的にインターネットに公開できるトンネリングツールです。無料プランでも基本的な機能が利用可能です。

### ngrokのセットアップ

1. **ngrokのインストール**

   ```bash
   # macOS (Homebrew)
   brew install ngrok

   # または公式サイトからダウンロード
   # https://ngrok.com/download
   ```

2. **アカウント作成とAuthtoken設定**

   - [ngrok.com](https://ngrok.com) でアカウントを作成（無料）
   - ダッシュボードからAuthtokenをコピー
   - Authtokenを設定：

   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **開発サーバーを起動**

   ```bash
   npm run dev
   ```

4. **ngrokでトンネルを作成**

   別のターミナルで：

   ```bash
   ngrok http 3000
   ```

5. **生成されたURLを使用**

   ngrokが表示する `https://xxxx-xxxx-xxxx.ngrok-free.dev` のURLを使用してアクセス

### 注意事項

- 無料プランでは初回アクセス時に警告ページが表示されます（「Visit Site」をクリックして進む）
- ngrokのURLは一時的なもので、再起動するたびに変わります
- WebRTCとWeb Speech APIはHTTPS環境が必要なため、ngrokのHTTPS URLを使用してください

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
