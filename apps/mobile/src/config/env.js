import { Platform } from 'react-native';
import Constants from 'expo-constants';

const resolveHostIp = () => {
  const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return '127.0.0.1';
};

const defaultHost = resolveHostIp();

const getInitialBaseUrl = () => {
  const envUrl =
    process.env.TOK_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    Constants?.expoConfig?.extra?.TOK_API_BASE_URL ||
    Constants?.manifest?.extra?.TOK_API_BASE_URL;

  if (envUrl) {
    // 안드로이드 실기기/에뮬레이터에서 localhost나 127.0.0.1이 들어있을 경우 보정
    if (Platform.OS === 'android' && (envUrl.includes('127.0.0.1') || envUrl.includes('localhost'))) {
      return envUrl.replace(/127\.0\.0\.1|localhost/, defaultHost);
    }
    return envUrl;
  }
  return `http://${defaultHost}:4000`;
};

const rawApiBaseUrl = getInitialBaseUrl();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

const rawWsBaseUrl =
  process.env.EXPO_PUBLIC_WS_BASE_URL ||
  API_BASE_URL;

const resolveOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return String(value || '').replace(/\/$/, '');
  }
};

export const WS_BASE_URL = resolveOrigin(rawWsBaseUrl);
export const REQUEST_TIMEOUT_MS = 10000;
export const STORAGE_TOKEN_KEY = 'tokfriends_access_token';

export const USE_DUMMY_AUTH =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  (() => {
  const val =
    process.env.EXPO_PUBLIC_DISABLE_AUTH ||
    process.env.DISABLE_AUTH_AND_PAYMENT ||
    process.env.EXPO_PUBLIC_USE_DUMMY_AUTH;
  if (val === undefined || val === null) return false;
  const lowered = String(val).toLowerCase();
  return lowered === '1' || lowered === 'true' || lowered === 'yes';
})();

export default {
  API_BASE_URL,
  WS_BASE_URL,
  REQUEST_TIMEOUT_MS,
  STORAGE_TOKEN_KEY,
  USE_DUMMY_AUTH,
};
