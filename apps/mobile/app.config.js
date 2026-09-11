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
    android: {
      ...(resolvedConfig.android ?? {}),
      package: 'com.sonjunho.ddakchin',
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
