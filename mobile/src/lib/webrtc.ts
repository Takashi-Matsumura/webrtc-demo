import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

// WebRTC設定
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// PeerConnectionの作成
export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection(rtcConfig);
};

// オファーの作成
export const createOffer = async (pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> => {
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
  });
  await pc.setLocalDescription(offer);
  return offer;
};

// アンサーの作成
export const createAnswer = async (
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> => {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
};

// リモート記述の設定
export const setRemoteDescription = async (
  pc: RTCPeerConnection,
  description: RTCSessionDescriptionInit
): Promise<void> => {
  await pc.setRemoteDescription(new RTCSessionDescription(description));
};

// ICE候補の追加
export const addIceCandidate = async (
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> => {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
};

// マイクストリームの取得
export const getUserMedia = async (): Promise<MediaStream> => {
  try {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    return stream as MediaStream;
  } catch (error) {
    console.error('マイクへのアクセスに失敗しました:', error);
    throw error;
  }
};
