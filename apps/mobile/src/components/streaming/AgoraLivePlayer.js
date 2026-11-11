import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';

const LIVE_ACCENT = '#FF3B6B';

export default function AgoraLivePlayer({
  appId,
  channelName,
  token,
  uid,
  isHost = false,
  isVideoSubscribed = true,
  isSpeakerMuted = false,
  cameraFacing = 'front', // 'front' | 'back'
  hostInfo = {},
  onStreamStatusChange,
}) {
  const webViewRef = useRef(null);
  const [streamState, setStreamState] = useState('connecting'); // 'connecting' | 'playing' | 'waiting' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync Video Subscription & Mute State to WebView
  useEffect(() => {
    if (!webViewRef.current) return;
    const command = JSON.stringify({
      type: 'SET_STREAM_CONFIG',
      isVideoSubscribed,
      isSpeakerMuted,
    });
    webViewRef.current.postMessage(command);
  }, [isVideoSubscribed, isSpeakerMuted]);

  // Sync Camera Facing (Front <-> Rear) to WebView
  useEffect(() => {
    if (!webViewRef.current) return;
    const command = JSON.stringify({
      type: 'SWITCH_CAMERA',
      cameraFacing, // 'front' | 'back'
    });
    webViewRef.current.postMessage(command);
  }, [cameraFacing]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'STATE_CHANGE') {
        setStreamState(data.state);
        if (onStreamStatusChange) onStreamStatusChange(data.state);
      } else if (data.type === 'ERROR') {
        setStreamState('error');
        setErrorMessage(data.message || '라이브 스트리밍 연결 오류');
        if (onStreamStatusChange) onStreamStatusChange('error');
      }
    } catch {}
  };

  const safeAppId = (appId || '').replace(/'/g, "\\'");
  const safeToken = (token || '').replace(/'/g, "\\'");
  const safeChannel = (channelName || '').replace(/'/g, "\\'");
  const safeUid = Number(uid) || 0;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #050811;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #player-container {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }
    #remote-video {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 10;
    }
    #remote-video video {
      object-fit: cover !important;
      width: 100% !important;
      height: 100% !important;
    }
    #remote-video.front-camera video {
      transform: scaleX(-1) !important;
    }
    #remote-video.rear-camera video {
      transform: none !important;
    }
    .waiting-card {
      position: absolute;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: #fff;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(255, 59, 107, 0.2);
      border: 1px solid rgba(255, 59, 107, 0.4);
      color: #ff3b6b;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .status-text {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 8px;
    }
    .pulse-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff3b6b;
      margin-right: 6px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div id="player-container">
    <div id="remote-video" class="${isHost ? (cameraFacing === 'back' ? 'rear-camera' : 'front-camera') : ''}"></div>
    <div id="waiting-card" class="waiting-card" style="${isHost ? 'display: none !important;' : ''}">
      <div class="status-badge"><span class="pulse-dot"></span>D LIVE AGORA RTC</div>
      <div style="font-weight:700;font-size:16px;">실시간 라이브 신호 수신 중...</div>
      <div class="status-text">호스트의 고화질 스트림 연결을 준비하고 있습니다.</div>
    </div>
  </div>

  <script>
    const sendState = (state, extra = {}) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATE_CHANGE', state, ...extra }));
      }
    };

    const sendError = (message) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message }));
      }
    };

    let client = null;
    let remoteVideoTrack = null;
    let remoteAudioTrack = null;
    let localVideoTrack = null;
    let localAudioTrack = null;
    let isPublisherHost = ${Boolean(isHost)};
    let currentCameraFacing = '${cameraFacing || 'front'}';

    async function applyCameraFlip(facing) {
      if (!isPublisherHost) return;
      currentCameraFacing = facing;
      const isBack = facing === 'back';
      const targetFacingMode = isBack ? 'environment' : 'user';

      const container = document.getElementById('remote-video');
      if (container) {
        if (isBack) {
          container.classList.remove('front-camera');
          container.classList.add('rear-camera');
        } else {
          container.classList.remove('rear-camera');
          container.classList.add('front-camera');
        }
      }

      if (!client) return;

      try {
        // 1. 카메라 디바이스 목록에서 후면/전면 매칭 시도
        try {
          if (AgoraRTC && typeof AgoraRTC.getCameras === 'function') {
            const cameras = await AgoraRTC.getCameras();
            if (cameras && cameras.length > 1) {
              const targetCam = cameras.find(function(c) {
                const lbl = (c.label || '').toLowerCase();
                return isBack
                  ? (lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment') || lbl.includes('0'))
                  : (lbl.includes('front') || lbl.includes('user') || lbl.includes('1'));
              });
              if (targetCam && targetCam.deviceId && localVideoTrack && typeof localVideoTrack.setDevice === 'function') {
                await localVideoTrack.setDevice(targetCam.deviceId);
                sendState('camera_switched', { facing });
                return;
              }
            }
          }
        } catch (devErr) {
          console.warn('setDevice attempt failed, switching via recreate track:', devErr);
        }

        // 2. 새 트랙 생성 후 교체 (WebRTC 표준 facingMode 제약조건)
        if (localVideoTrack) {
          try {
            await client.unpublish(localVideoTrack);
          } catch (e) {}
          try {
            localVideoTrack.stop();
            localVideoTrack.close();
          } catch (e) {}
          localVideoTrack = null;
        }

        localVideoTrack = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            localVideoTrack = await AgoraRTC.createCameraVideoTrack({
              facingMode: targetFacingMode,
              optimizationMode: 'motion',
              encoderConfig: {
                width: { ideal: 720, max: 1280 },
                height: { ideal: 1280, max: 1920 },
                frameRate: { ideal: 24, max: 30 },
                bitrateMin: 600,
                bitrateMax: 1500,
              },
            });
            if (localVideoTrack) break;
          } catch (camErr) {
            await new Promise(function(resolve) { setTimeout(resolve, 600); });
          }
        }

        if (localVideoTrack) {
          const remoteContainer = document.getElementById('remote-video');
          if (remoteContainer) {
            remoteContainer.innerHTML = '';
            localVideoTrack.play('remote-video', { fit: 'cover' });
          }
          await client.publish(localVideoTrack);
          sendState('camera_switched', { facing });
        }
      } catch (switchErr) {
        console.error('Camera switch error:', switchErr);
      }
    }

    async function initAgora() {
      const appId = '${safeAppId}';
      const token = '${safeToken}';
      const channel = '${safeChannel}';
      const uid = ${safeUid};

      if (!appId || !channel) {
        sendError('Agora 설정(App ID / 채널)이 올바르지 않습니다.');
        return;
      }

      try {
        if (!window.AgoraRTC) {
          sendError('Agora WebRTC SDK 로드 실패');
          return;
        }

        AgoraRTC.setLogLevel(2);
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        const isPublisherHost = ${Boolean(isHost)};

        if (isPublisherHost) {
          await client.setClientRole('host');
          try {
            if (typeof client.enableDualStream === 'function') {
              await client.enableDualStream();
            }
          } catch (dsErr) {}
        } else {
          await client.setClientRole('audience', { level: 1 });

          client.on('user-published', async (user, mediaType) => {
            try {
              await client.subscribe(user, mediaType);
              if (mediaType === 'video') {
                remoteVideoTrack = user.videoTrack;
                const remoteContainer = document.getElementById('remote-video');
                if (remoteContainer) {
                  remoteContainer.innerHTML = '';
                  remoteVideoTrack.play('remote-video', { fit: 'cover' });
                }
                const waiting = document.getElementById('waiting-card');
                if (waiting) waiting.style.display = 'none';
                sendState('playing');
              }
              if (mediaType === 'audio') {
                remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
              }
            } catch (subErr) {
              console.error('Subscription error', subErr);
            }
          });

          client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'video') {
              const waiting = document.getElementById('waiting-card');
              if (waiting) waiting.style.display = 'flex';
              sendState('waiting');
            }
          });
        }

        client.on('connection-state-change', (curState, revState) => {
          if (curState === 'DISCONNECTED') {
            if (!isPublisherHost) {
              const waiting = document.getElementById('waiting-card');
              if (waiting) waiting.style.display = 'flex';
              sendState('waiting');
            }
          }
        });

        // 1. Agora RTC 채널 먼저 접속 (Join FIRST!)
        const joinedUid = await client.join(
          appId,
          channel,
          (token && token.length > 5) ? token : null,
          uid > 0 ? uid : null
        );

        sendState('connected', { joinedUid });

        // 2. 호스트인 경우: 채널 접속 성공 후 카메라/마이크 생성 및 퍼블리시
        if (isPublisherHost) {
          try {
            const waiting = document.getElementById('waiting-card');
            if (waiting) waiting.style.display = 'none';

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              const targetFacingMode = currentCameraFacing === 'back' ? 'environment' : 'user';

              // 1) 마이크 오디오 트랙 생성
              try {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              } catch (micErr) {
                console.warn('Microphone track error:', micErr);
              }

              // 2) 카메라 비디오 트랙 생성 (하드웨어 락 대기 및 최대 3회 재시도)
              for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                  localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    facingMode: targetFacingMode,
                    optimizationMode: 'motion',
                    encoderConfig: {
                      width: { ideal: 720, max: 1280 },
                      height: { ideal: 1280, max: 1920 },
                      frameRate: { ideal: 24, max: 30 },
                      bitrateMin: 600,
                      bitrateMax: 1500,
                    },
                  });
                  if (localVideoTrack) break;
                } catch (camErr) {
                  console.warn('Camera create attempt ' + attempt + ' failed:', camErr);
                  await new Promise(function(resolve) { setTimeout(resolve, 800); });
                }
              }

              if (localVideoTrack) {
                const remoteContainer = document.getElementById('remote-video');
                if (remoteContainer) {
                  remoteContainer.innerHTML = '';
                  localVideoTrack.play('remote-video', { fit: 'cover' });
                }
              }

              const tracks = [localAudioTrack, localVideoTrack].filter(Boolean);
              if (tracks.length > 0) {
                await client.publish(tracks);
                sendState('broadcasting', { hasVideo: Boolean(localVideoTrack), hasAudio: Boolean(localAudioTrack) });
              }
              sendState('playing');
            } else {
              sendState('fallback_camera');
            }
          } catch (pubErr) {
            console.warn('Host publish notice:', pubErr);
            sendState('playing');
          }
        }
      } catch (err) {
        console.warn('Agora join notice:', err);
        if (!isPublisherHost) {
          sendError((err && err.message) || 'Agora 채널 접속 실패');
        } else {
          sendState('playing');
        }
      }
    }

    window.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'SWITCH_CAMERA') {
          if (data.cameraFacing) {
            applyCameraFlip(data.cameraFacing);
          }
        } else if (data.type === 'SET_STREAM_CONFIG') {
          if (remoteVideoTrack) {
            if (data.isVideoSubscribed === false) {
              remoteVideoTrack.stop();
            } else {
              remoteVideoTrack.play('remote-video', { fit: 'cover' });
            }
          }
          if (remoteAudioTrack) {
            if (data.isSpeakerMuted === true) {
              remoteAudioTrack.setVolume(0);
            } else {
              remoteAudioTrack.setVolume(100);
            }
          }
        }
      } catch {}
    });

    window.document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAgora, 200);
    });
  </script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      {/* Background WebRTC Video Stream */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://app.mocco.live' }}
        style={styles.webView}
        allowsInlineMediaPlayback={true}
        mediaCapturePermissionGrantType="grant"
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        scalesPageToFit={false}
        textZoom={100}
        setBuiltInZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={handleMessage}
        renderError={() => (
          !isHost ? (
            <View style={styles.errorOverlay}>
              <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
              <Text style={styles.errorTitle}>스트림 로드 오류</Text>
              <Text style={styles.errorSubtitle}>네트워크 상태를 확인해 주세요</Text>
            </View>
          ) : null
        )}
      />

      {/* Host Avatar & Wait Overlay (Shown when stream is connecting or waiting) */}
      {!isHost && streamState === 'connecting' && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={LIVE_ACCENT} />
          <Text style={styles.connectingText}>Agora 실시간 스트림 연결 중...</Text>
        </View>
      )}

      {!isHost && streamState === 'waiting' && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Avatar
            size={90}
            name={hostInfo?.name}
            uri={hostInfo?.avatar}
            showBorder
            style={styles.hostAvatarVisual}
          />
          <Text style={styles.videoHostCaption}>
            {hostInfo?.name || '호스트'}님의 실시간 영상 방송
          </Text>
          <Text style={styles.viewerRoleSubtitle}>
            호스트 방송 신호를 수신 대기 중입니다
          </Text>
        </View>
      )}

      {!isHost && streamState === 'error' && errorMessage && (
        <View style={styles.errorOverlay}>
          <Ionicons name="warning-outline" size={40} color="#F59E0B" />
          <Text style={styles.errorTitle}>라이브 스트림 대기</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setStreamState('connecting');
              setErrorMessage(null);
              if (webViewRef.current) {
                webViewRef.current.reload();
              }
            }}
          >
            <Text style={styles.retryButtonText}>스트림 다시 연결</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050811',
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 17, 0.75)',
    zIndex: 15,
  },
  connectingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  hostAvatarVisual: {
    marginBottom: 12,
  },
  videoHostCaption: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  viewerRoleSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.9)',
    zIndex: 20,
    padding: 24,
  },
  errorTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: LIVE_ACCENT,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
