// app.config.js

// gradle 속성 보조 함수들
const ensureGradleProperty = (properties, name, value) => {
  if (value == null) {
    return;
  }
  const stringValue = String(value);
  const existingProperty = properties.find(
    (property) => property.type === 'property' && property.key === name,
  );
  if (existingProperty) {
    existingProperty.value = stringValue;
  } else {
    properties.push({ type: 'property', key: name, value: stringValue });
  }
};

const setGradlePluginVersion = (buildGradleContents, version) => {
  if (!version) {
    return buildGradleContents;
  }
  const dependencyPattern =
    /classpath\(['"]com\.android\.tools\.build:gradle(?::[^'"]+)?['"]\)/;
  if (!dependencyPattern.test(buildGradleContents)) {
    return buildGradleContents;
  }
  return buildGradleContents.replace(
    dependencyPattern,
    `classpath('com.android.tools.build:gradle:${version}')`,
  );
};

// 스낵 환경 여부 판별
const isSnackEnvironment = () => {
  const flag = process.env.SNACK_ENV;
  return flag === '1' || flag === 'true';
};

const parseAdminOverrideCodes = (input) => {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
};

module.exports = ({ config }) => {
  const resolvedConfig = config ?? {};
  const snackEnvironment = isSnackEnvironment();
  const adminOverrideCodes =
    parseAdminOverrideCodes(process.env.EXPO_PUBLIC_ADMIN_OVERRIDE_CODES) ||
    parseAdminOverrideCodes(process.env.ADMIN_OVERRIDE_CODES) ||
    parseAdminOverrideCodes(resolvedConfig?.extra?.ADMIN_OVERRIDE_CODES);

  // 플러그인 목록 복사
  const plugins = [...(resolvedConfig.plugins ?? [])];

  // 스낵 환경이 아닌 경우에만 Android 빌드 속성 플러그인 로딩
  if (!snackEnvironment) {
    // 동적으로 @expo/config-plugins 로드 (Snack에서 모듈 없을 때 오류 방지)
    const { withGradleProperties, withProjectBuildGradle } = require('@expo/config-plugins');

    // Android 빌드 속성 적용 함수
    const withAndroidBuildProperties = (config, options = {}) => {
      const { android = {} } = options;
      let updatedConfig = withGradleProperties(config, (gradleConfig) => {
        const { modResults } = gradleConfig;

        [
          ['android.compileSdkVersion', android.compileSdkVersion],
          ['android.targetSdkVersion', android.targetSdkVersion],
          ['android.minSdkVersion', android.minSdkVersion],
          ['android.kotlinVersion', android.kotlinVersion],
        ].forEach(([name, propertyValue]) => {
          ensureGradleProperty(modResults, name, propertyValue);
        });

        return gradleConfig;
      });

      if (android.gradlePluginVersion) {
        updatedConfig = withProjectBuildGradle(updatedConfig, (gradleConfig) => {
          gradleConfig.modResults.contents = setGradlePluginVersion(
            gradleConfig.modResults.contents,
            android.gradlePluginVersion,
          );
          return gradleConfig;
        });
      }

      return updatedConfig;
    };

    // Android 빌드 속성 플러그인 추가
    plugins.push([
      withAndroidBuildProperties,
      {
        android: {
          kotlinVersion: '2.0.21',
          gradlePluginVersion: '8.7.2',
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
        },
      },
    ]);
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
      ADMIN_OVERRIDE_CODES:
        adminOverrideCodes && adminOverrideCodes.length > 0
          ? adminOverrideCodes
          : ['123456'],
      eas: {
        projectId: 'eb3c1b74-5c41-4ce0-9574-d0d3eb932d72',
      },
    },
  };
};
