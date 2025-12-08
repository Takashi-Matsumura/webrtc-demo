# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (custom server with Socket.io)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a WebRTC voice chat application with real-time transcription built on Next.js 16 (App Router) with a custom server for Socket.io integration.

### Key Components

**Custom Server (`server.js`)**
- Integrates Socket.io with Next.js for WebRTC signaling
- Manages room creation/joining and user connections
- Handles signaling messages (offer, answer, ice-candidate)

**Hooks (`src/hooks/`)**
- `useSocket.ts` - Socket.io connection management
- `useWebRTC.ts` - WebRTC peer connection, audio streaming, call state
- `useSpeechRecognition.ts` - Web Speech API for real-time transcription (Japanese)

**Libraries (`src/lib/`)**
- `socket.ts` - Socket.io client singleton
- `webrtc.ts` - WebRTC configuration and helper functions (uses Google STUN servers)

### Data Flow

1. User creates/joins room via Socket.io signaling
2. WebRTC peer connection established using offer/answer exchange
3. Audio streams transmitted P2P via WebRTC
4. Local speech recognition runs on each client independently

### Browser Requirements

- Chrome recommended (Web Speech API support)
- Microphone permission required

## Mobile App

The `mobile/` directory contains the React Native (Expo) iOS app.

### Quick Start

```bash
cd mobile
npx expo start --dev-client          # WiFi development
npx expo start --dev-client --tunnel # Tethering development
```

## EAS Build (TestFlight/App Store)

### Important: Mobile is NOT in npm workspaces

The `mobile/` directory is intentionally **excluded from npm workspaces** in the root `package.json`. This is required for EAS Build compatibility - EAS Build uses `npm ci` which requires a standalone `package-lock.json` in the mobile directory.

### Required Dependencies for expo-router

When using `expo-router`, these peer dependencies must be explicitly listed in `mobile/package.json`:

```json
"react-native-gesture-handler": "~2.24.0",
"react-native-safe-area-context": "5.4.0",
"react-native-screens": "^4.18.0"
```

### Xcode/iOS SDK Compatibility

- Use the latest `react-native-screens` version for Xcode 16+ / iOS SDK 26+ compatibility
- Older versions cause `std::move` compilation errors

### Build Commands

```bash
cd mobile
eas build --platform ios --profile production    # Production build for App Store
eas submit --platform ios                        # Submit to App Store Connect
```

## Claude Skills

For detailed development guides, see `.claude/skills/`:

- **ios-dev** - iOS development setup, commands, tethering, troubleshooting
- **speech-recognition** - Speech recognition implementation details (accumulated text tracking, session management)
- **testflight** - TestFlight and App Store distribution guide
