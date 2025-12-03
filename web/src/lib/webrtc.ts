import { RTCConfig } from '@/types';

// WebRTC設定
export const rtcConfig: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// マイクへのアクセスを取得
export const getUserMedia = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotFoundError':
          console.error('マイクが見つかりません。マイクが接続されているか確認してください。');
          break;
        case 'NotAllowedError':
          console.error('マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。');
          break;
        case 'NotReadableError':
          console.error('マイクが他のアプリケーションで使用中です。');
          break;
        default:
          console.error('マイクへのアクセスに失敗しました:', error.message);
      }
    } else {
      console.error('マイクへのアクセスに失敗しました:', error);
    }
    throw error;
  }
};

// PeerConnectionを作成
export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection(rtcConfig);
};

// オファーを作成
export const createOffer = async (
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

// アンサーを作成
export const createAnswer = async (
  peerConnection: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

// リモートディスクリプションを設定
export const setRemoteDescription = async (
  peerConnection: RTCPeerConnection,
  description: RTCSessionDescriptionInit
): Promise<void> => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
};

// ICE候補を追加
export const addIceCandidate = async (
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};
