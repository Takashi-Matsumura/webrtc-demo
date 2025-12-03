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
    ├── ios/                  # ネイティブiOSプロジェクト（prebuildで生成）
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

---

## iOS開発環境の詳細セットアップ

React Native（Expo）でiOSアプリを開発するための詳細な手順です。

### 前提条件

- **macOS** が必要（iOSアプリのビルドにはMacが必須）
- **Xcode** がインストールされていること
- **Node.js** 18以上

### Xcodeのインストール

1. App Storeから **Xcode** をインストール（約12GB、時間がかかります）
2. インストール後、一度Xcodeを起動してライセンスに同意
3. コマンドラインツールをインストール：
   ```bash
   xcode-select --install
   ```

### iOSシミュレーターのセットアップ

1. Xcodeを開く
2. **Xcode → Settings（設定）→ Components** を選択
3. 使用したいiOSバージョンの **Simulator Runtime** をダウンロード
   - 例：iOS 18.x または iOS 26.x

### 環境構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mac (開発PC)                            │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ Signaling Server│    │  Metro Bundler  │                    │
│  │   (port 3001)   │    │   (port 8081)   │                    │
│  │                 │    │                 │                    │
│  │ Socket.io通信   │    │ JSバンドル配信   │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│           │    ┌─────────────────┤                              │
│           │    │                 │                              │
│           ▼    ▼                 ▼                              │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  iOS Simulator  │    │   Real iPhone   │◄── USB接続         │
│  │                 │    │                 │                    │
│  │ localhost:3001  │    │ 192.168.x.x:3001│                    │
│  │ localhost:8081  │    │ 192.168.x.x:8081│                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### シミュレーターでの実行

シミュレーターは仮想的なiPhoneデバイスです。実機がなくても基本的な動作確認ができます。

```bash
# 1. シグナリングサーバーを起動
cd server
npm run dev
# → http://localhost:3001 で起動

# 2. 別ターミナルで mobile ディレクトリに移動
cd mobile

# 3. 環境変数を設定（シミュレーター用はlocalhostでOK）
echo "EXPO_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001" > .env

# 4. ネイティブプロジェクトを生成
npx expo prebuild --platform ios

# 5. シミュレーターでビルド＆実行
npx expo run:ios
```

**シミュレーターの制限事項：**
- 音声認識（Speech Recognition）が動作しない
- カメラ・マイクの一部機能が制限される
- WebRTCは動作するが、音声は実際には送受信されない

### 実機（iPhone）での実行

実機でテストすると、音声認識を含む全機能が動作します。

#### 1. Apple IDの設定（無料）

App Store登録なしでも、無料のApple IDで7日間有効な開発用証明書を使えます。

1. Xcodeを開く
2. **Xcode → Settings → Accounts** を選択
3. 左下の **「+」** ボタンをクリック
4. **Apple ID** を選択してサインイン

#### 2. iPhoneの準備

**デベロッパモードを有効にする：**
1. iPhoneの **設定 → プライバシーとセキュリティ** を開く
2. 一番下の **デベロッパモード** をオンにする
3. iPhoneを再起動

**Macを信頼する：**
1. USBケーブルでiPhoneをMacに接続
2. iPhone画面に「このコンピュータを信頼しますか？」と表示されたら「信頼」をタップ
3. パスコードを入力

#### 3. 環境変数の設定

実機からMacのサーバーに接続するには、MacのIPアドレスが必要です。

```bash
# MacのIPアドレスを確認
ipconfig getifaddr en0
# 例: 192.168.1.11

# 環境変数を設定
cd mobile
echo "EXPO_PUBLIC_SIGNALING_SERVER_URL=http://192.168.1.11:3001" > .env
```

#### 4. Bundle Identifierの設定

無料Apple IDの場合、ユニークなBundle Identifierが必要です。

`mobile/app.json` を編集：
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.voicechat"
    }
  }
}
```

#### 5. ビルドと実行

```bash
# 1. シグナリングサーバーを起動
cd server
npm run dev

# 2. ネイティブプロジェクトを再生成（Bundle ID変更後）
cd mobile
npx expo prebuild --platform ios --clean

# 3. 実機向けにビルド
npx expo run:ios --device
```

#### 6. 初回実行時の追加設定

**キーチェーンアクセスの許可：**
- 「codesignがキーチェーンにアクセスしようとしています」と表示されたら
- Macのログインパスワードを入力して「常に許可」をクリック

**開発者証明書の信頼：**
1. iPhoneの **設定 → 一般 → VPNとデバイス管理** を開く
2. 「デベロッパApp」の下にあるApple IDをタップ
3. 「信頼」をタップ

#### 7. アプリの起動

初回ビルド後、iPhoneでアプリを起動すると「Development Build」画面が表示されます：

1. **Enter URL manually** を展開
2. `http://192.168.1.11:8081` を入力（MacのIPアドレス）
3. **Connect** をタップ

### 開発の再開方法

次回の開発時は以下の手順で再開できます：

```bash
# ターミナル1: シグナリングサーバー
cd server
npm run dev

# ターミナル2: Metro Bundler（JSバンドラー）
cd mobile
npx expo start --dev-client

# iPhoneでVoiceChatアプリを起動
# → http://192.168.1.11:8081 に接続
```

### トラブルシューティング

#### 「サーバーに接続中」のまま動かない
- MacのIPアドレスが変わっていないか確認
- ファイアウォールがポート3001と8081をブロックしていないか確認
- iPhoneとMacが同じWi-Fiネットワークにいるか確認

#### 「Device is busy」エラー
- iPhoneのロックを解除する
- USBケーブルを抜き差しする
- Xcodeを再起動する

#### ビルドエラー
```bash
# キャッシュをクリアして再ビルド
cd mobile
rm -rf ios
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

#### アプリがクラッシュする
```bash
# Metro Bundlerのキャッシュをクリア
npx expo start --dev-client --clear
```

### アーキテクチャの理解

#### Expo / React Native の仕組み

```
┌──────────────────────────────────────────────────────────────┐
│                      React Native アプリ                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              JavaScript (TypeScript)                   │  │
│  │                                                        │  │
│  │  ・React コンポーネント (UI)                            │  │
│  │  ・ビジネスロジック                                     │  │
│  │  ・状態管理                                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 React Native Bridge                    │  │
│  │         (JavaScript ↔ Native の通信レイヤー)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              ネイティブモジュール (Swift/ObjC)          │  │
│  │                                                        │  │
│  │  ・react-native-webrtc (WebRTC通信)                    │  │
│  │  ・@react-native-voice/voice (音声認識)                │  │
│  │  ・UIKit (ネイティブUI)                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 開発ビルド vs プロダクションビルド

| 項目 | 開発ビルド | プロダクションビルド |
|------|-----------|-------------------|
| JSコード | Metro Bundlerから動的に取得 | アプリに埋め込み |
| デバッグ | 可能（Hot Reload対応） | 不可 |
| 速度 | やや遅い | 高速 |
| 用途 | 開発中 | App Store配布 |

#### Expo prebuild の役割

```bash
npx expo prebuild --platform ios
```

このコマンドは以下を行います：
1. `app.json` の設定を読み取る
2. `ios/` ディレクトリにXcodeプロジェクトを生成
3. ネイティブモジュール（WebRTC、Voice等）を組み込む
4. CocoaPodsで依存関係をインストール

### 証明書の有効期限について

無料Apple IDで作成した開発用証明書は **7日間** で期限切れになります。

期限切れ後は：
1. iPhoneからアプリを削除
2. Xcodeで再ビルド
3. 新しい証明書で再インストール

**有料のApple Developer Program（年間$99）に登録すると：**
- 1年間有効な証明書
- App Storeへの配布が可能
- TestFlightでのベータ配布
