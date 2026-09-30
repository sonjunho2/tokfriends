// src/utils/pushNotifications.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

const PUSH_DEVICE_TOKEN_KEY = 'dagaon_device_token';
const PUSH_ENABLED_KEY = 'dagaon_push_enabled';

export async function getOrCreateDeviceToken() {
  try {
    let token = await AsyncStorage.getItem(PUSH_DEVICE_TOKEN_KEY);
    if (!token) {
      token = `dagaon_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await AsyncStorage.setItem(PUSH_DEVICE_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `dagaon_${Platform.OS}_fallback_${Date.now()}`;
  }
}

export async function registerPushNotifications() {
  try {
    const isEnabled = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
    if (isEnabled === 'false') return null;

    const token = await getOrCreateDeviceToken();
    await apiClient.registerDeviceToken({
      token,
      platform: Platform.OS || 'android',
      locale: 'ko',
    });
    return token;
  } catch (err) {
    console.warn('Push notification registration skipped/failed:', err?.message || err);
    return null;
  }
}

export async function unregisterPushNotifications() {
  try {
    const token = await AsyncStorage.getItem(PUSH_DEVICE_TOKEN_KEY);
    if (token) {
      await apiClient.unregisterDeviceToken(token);
    }
    await AsyncStorage.setItem(PUSH_ENABLED_KEY, 'false');
  } catch (err) {
    console.warn('Push notification unregister failed:', err?.message || err);
  }
}

export async function setPushNotificationsEnabled(enabled) {
  try {
    await AsyncStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      await registerPushNotifications();
    } else {
      await unregisterPushNotifications();
    }
  } catch (err) {
    console.warn('Failed to update push preference:', err);
  }
}

export async function getPushNotificationsEnabled() {
  try {
    const val = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}
