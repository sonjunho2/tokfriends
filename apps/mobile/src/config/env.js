import Constants from 'expo-constants';

const parseAdminOverrideCodes = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((v) => String(v || '').trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

const rawAdminCodes =
  process.env.EXPO_PUBLIC_ADMIN_OVERRIDE_CODES ||
  process.env.ADMIN_OVERRIDE_CODES ||
  Constants?.expoConfig?.extra?.ADMIN_OVERRIDE_CODES ||
  Constants?.manifest?.extra?.ADMIN_OVERRIDE_CODES ||
  '123456';

export const ADMIN_OVERRIDE_CODES = parseAdminOverrideCodes(rawAdminCodes);

const rawApiBaseUrl =
  process.env.TOK_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants?.expoConfig?.extra?.TOK_API_BASE_URL ||
  Constants?.manifest?.extra?.TOK_API_BASE_URL ||
  'https://tok-friends-api.onrender.com';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 10000;
export const STORAGE_TOKEN_KEY = 'tokfriends_access_token';

export const USE_DUMMY_AUTH = (() => {
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
  ADMIN_OVERRIDE_CODES,
};
