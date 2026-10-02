// app.config.js

module.exports = ({ config }) => {
  const resolvedConfig = config ?? {};
  // 플러그인 목록 복사
  const plugins = [...(resolvedConfig.plugins ?? [])];
  const requiredPlugins = [
    'expo-asset',
    'expo-font',
    'expo-image-picker',
    'expo-secure-store',
    'expo-video',
    'expo-splash-screen',
    'expo-status-bar',
  ];

  for (const plugin of requiredPlugins) {
    const alreadyConfigured = plugins.some((entry) =>
      Array.isArray(entry) ? entry[0] === plugin : entry === plugin,
    );

    if (!alreadyConfigured) {
      plugins.push(plugin);
    }
  }

  return {
    ...resolvedConfig,
    name: '다가온 (DAGAON)',
    slug: 'dagaon',
    version: '1.2.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'dagaon',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    android: {
      ...(resolvedConfig.android ?? {}),
      package: 'com.sonjunho.ddakchin',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
      ],
    },
    ios: {
      ...(resolvedConfig.ios ?? {}),
      bundleIdentifier: 'com.sonjunho.ddakchin',
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: '프로필 사진 등록 및 라이브 영상 방송 진행을 위해 카메라 권한이 필요합니다.',
        NSMicrophoneUsageDescription: '라이브 방송 시 음성을 전달하기 위해 마이크 권한이 필요합니다.',
        NSPhotoLibraryUsageDescription: '프로필 사진 등록 및 채팅 사진 전송을 위해 사진 보관함 접근 권한이 필요합니다.',
      },
    },
    updates: {
      ...(resolvedConfig.updates ?? {}),
      enabled: true,
      checkAutomatically: 'NEVER',
    },
    runtimeVersion: resolvedConfig.runtimeVersion ?? { policy: 'sdkVersion' },
    plugins,
    extra: {
      ...(resolvedConfig.extra ?? {}),
      TOK_API_BASE_URL:
        process.env.TOK_API_BASE_URL ??
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        resolvedConfig?.extra?.TOK_API_BASE_URL ??
        'https://tok-friends-api.onrender.com',
      eas: {
        projectId: 'eb3c1b74-5c41-4ce0-9574-d0d3eb932d72',
      },
    },
  };
};
