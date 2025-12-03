# WebRTC 音声通話アプリ

リアルタイム音声通話と自動文字起こし機能を備えたアプリケーションです。Web版とiOSネイティブアプリ版を提供するモノレポ構成です。

## 機能

- **ルーム機能**: ルームIDを生成・共有して2人まで参加可能
- **音声通話**: WebRTCによるP2P音声ストリーミング
- **ミュート**: マイクのオン/オフ切り替え
- **文字起こし**: リアルタイム音声認識（日本語対応）
- **音声レベル表示**: マイク入力のインジケーター

## プロジェクト構成

```
webrtc-demo/
├── web/          # Webアプリ（Next.js）
├── mobile/       # iOSアプリ（React Native / Expo）
├── server/       # スタンドアロン・シグナリングサーバー
└── shared/       # 共有型定義
```

## 技術スタック

### Web版
- Next.js 16 (App Router)
- TypeScript
- WebRTC (ネイティブAPI)
- Socket.io (シグナリング)
- Web Speech API (音声認識)
- Tailwind CSS

### Mobile版 (iOS)
- React Native / Expo
- TypeScript
- react-native-webrtc
- @react-native-voice/voice (音声認識)
- Socket.io

## セットアップ

### Web版

```bash
cd web
npm install
npm run dev
```

http://localhost:3000 でアクセス

### Mobile版 (iOS)

```bash
# 1. 依存関係のインストール
cd mobile
npm install

# 2. 環境変数の設定
cp .env.example .env
# EXPO_PUBLIC_SIGNALING_SERVER_URL を編集

# 3. ネイティブプロジェクトの生成
npx expo prebuild

# 4. iOSシミュレーターまたは実機で起動
npx expo run:ios
```

**注意**: react-native-webrtc を使用するため、Expo Go では動作しません。Development Build が必要です。

### シグナリングサーバー（Mobile用）

```bash
cd server
npm install
npm run dev
```

http://localhost:3001 で起動

## 使い方

1. ブラウザまたはアプリでアクセス
2. 「新しいルームを作成」をクリック
3. 生成されたルームIDを相手に共有
4. 相手がルームIDを入力して参加
5. 「通話開始」ボタンで通話スタート

## テスト方法

### ローカルテスト
同一PCで2つのブラウザタブを開いてテスト可能です。

### 異なるデバイス間でのテスト（ngrok）

PCとスマートフォンなど、異なるデバイス間でテストする場合は、ngrokを使用してローカルサーバーを外部公開できます。

1. **ngrokのインストール**

   ```bash
   # macOS (Homebrew)
   brew install ngrok
   ```

2. **アカウント作成とAuthtoken設定**

   - [ngrok.com](https://ngrok.com) でアカウントを作成（無料）
   - Authtokenを設定：

   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **開発サーバーを起動してトンネルを作成**

   ```bash
   # Web版
   cd web && npm run dev
   ngrok http 3000

   # または Mobile用シグナリングサーバー
   cd server && npm run dev
   ngrok http 3001
   ```

### 注意事項

- 無料プランでは初回アクセス時に警告ページが表示されます
- ngrokのURLは再起動するたびに変わります
- WebRTCとWeb Speech APIはHTTPS環境が必要です

## ブラウザ対応

- **推奨**: Chrome（Web Speech API完全対応）
- マイクへのアクセス許可が必要

## ディレクトリ構成

```
webrtc-demo/
├── package.json              # ルート（ワークスペース管理）
├── shared/
│   └── types.ts              # 共有型定義
├── server/
│   ├── package.json
│   └── server.js             # シグナリングサーバー (port 3001)
├── web/
│   ├── package.json
│   ├── server.js             # Next.js + Socket.io 統合サーバー
│   └── src/
│       ├── app/              # Next.js App Router
│       ├── components/       # React コンポーネント
│       ├── hooks/            # カスタムフック
│       ├── lib/              # ユーティリティ
│       └── types/            # 型定義
└── mobile/
    ├── package.json
    ├── app.json              # Expo設定
    ├── app/                  # Expo Router
    │   ├── _layout.tsx
    │   ├── index.tsx         # ホーム画面
    │   └── room/[id].tsx     # ルーム画面
    └── src/
        ├── components/       # React Native コンポーネント
        ├── hooks/            # カスタムフック
        ├── lib/              # ユーティリティ
        └── types/            # 型定義
```
