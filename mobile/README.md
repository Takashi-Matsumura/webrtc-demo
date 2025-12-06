# VoiceChat Mobile App

React Native (Expo) で構築されたWebRTC音声通話アプリ。

## 開発環境

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npx expo start --dev-client

# テザリング時（USBでiPhoneに接続）
npx expo start --dev-client --tunnel
```

## EAS (Expo Application Services)

EASはExpoが提供するクラウドベースのビルド・配布サービスです。

### EASの主なサービス

| サービス | 説明 |
|----------|------|
| **EAS Build** | クラウドでiOS/Androidアプリをビルド |
| **EAS Submit** | App Store / Google Playへの自動提出 |
| **EAS Update** | OTAアップデート（審査なしでJSコードを更新） |

### セットアップ

```bash
# EAS CLIのインストール
npm install -g eas-cli

# Expoアカウントにログイン
eas login
```

### ビルドコマンド

```bash
# 開発ビルド（実機テスト用）
eas build --platform ios --profile development

# プレビュービルド（内部配布用）
eas build --platform ios --profile preview

# 本番ビルド（TestFlight/App Store用）
eas build --platform ios --profile production
```

### TestFlight提出

```bash
# 本番ビルド作成
eas build --platform ios --profile production

# App Store Connectに提出
eas submit --platform ios
```

## 設定ファイル

### eas.json

ビルドプロファイルと提出設定を管理：

- `development`: 開発用ビルド（dev-client使用）
- `preview`: 内部配布用ビルド
- `production`: App Store提出用ビルド

### app.json

アプリの基本設定：

- Bundle ID: `com.takashimats.voicechat`
- 権限: マイク、音声認識

## 必要な外部アカウント

| サービス | 用途 | 備考 |
|----------|------|------|
| Expo | EASビルド・配布 | 無料プランあり |
| Apple Developer Program | TestFlight/App Store配布 | $99/年 |

## 次のステップ（TestFlight提出）

1. Apple Developer Programの承認を待つ（48時間以内）
2. Apple Team IDを`eas.json`に設定
3. `eas build --platform ios --profile production`でビルド
4. `eas submit --platform ios`でTestFlightに提出
