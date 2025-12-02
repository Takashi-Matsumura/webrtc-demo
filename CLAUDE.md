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
