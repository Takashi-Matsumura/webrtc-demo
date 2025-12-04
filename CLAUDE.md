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

## Mobile Development (iOS)

### Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx
│   ├── index.tsx           # Home screen
│   └── room/[id].tsx       # Voice call room
├── src/
│   ├── components/         # UI components
│   │   ├── Transcription.tsx  # Transcription display with session indicators
│   │   └── ...
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts  # iOS speech recognition (key hook)
│   │   ├── useWebRTC.ts
│   │   └── useSocket.ts
│   └── types/
└── .env                    # Signaling server URL
```

### Key Commands

```bash
cd mobile

# Development (WiFi environment)
npx expo start --dev-client

# Development (Tethering environment - requires tunnel)
npx expo start --dev-client --tunnel

# Build for device
npx expo run:ios --device "DEVICE_NAME"

# Clean rebuild
npx expo prebuild --platform ios --clean
```

### Speech Recognition Hook (`useSpeechRecognition.ts`)

Critical implementation details:
- Uses `@react-native-voice/voice` for iOS speech recognition
- **Silence detection**: 2-second timeout finalizes current transcript session
- **Accumulated text tracking**: iOS Voice API returns cumulative text since `Voice.start()`
  - `lastFinalizedTextLengthRef` tracks confirmed text length
  - `extractNewText()` extracts only new content from accumulated results
- **Session management**: Visual indicator (blue border) shows active sessions
- **Auto-restart**: On `onSpeechEnd`, recognition restarts for continuous listening

### Environment Configuration

```bash
# WiFi development (same network)
EXPO_PUBLIC_SIGNALING_SERVER_URL=http://192.168.x.x:3001

# Production (Render)
EXPO_PUBLIC_SIGNALING_SERVER_URL=https://webrtc-signaling-xxxx.onrender.com
```

### Tethering Development

When using iPhone Personal Hotspot:
- Direct IP connection doesn't work (iOS hotspot isolation)
- Must use `--tunnel` flag to create ngrok tunnel
- Use **HTTPS** URL (iOS App Transport Security requirement)

### Common Issues

| Issue | Solution |
|-------|----------|
| "Speech recognition already started" | Ensure single Voice.start() call, check isManualRestarting flag |
| Previous text appears in new session | Verify lastFinalizedTextLengthRef accumulates correctly |
| App crash on silence detection | Don't restart Voice during silence timer - use text tracking instead |
| Metro connection fails on tethering | Use `--tunnel` flag with HTTPS URL |
