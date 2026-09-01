import Constants from 'expo-constants';

const rawApiBaseUrl =
  process.env.TOK_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants?.expoConfig?.extra?.TOK_API_BASE_URL ||
  Constants?.manifest?.extra?.TOK_API_BASE_URL ||
  'https://tok-friends-api.onrender.com';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');
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
  REQUEST_TIMEOUT_MS,
  STORAGE_TOKEN_KEY,
  USE_DUMMY_AUTH,
};
