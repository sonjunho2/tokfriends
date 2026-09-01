import { Platform } from 'react-native';

export const IAP_UNAVAILABLE_MESSAGE = '현재 환경에서는 인앱 결제를 사용할 수 없습니다.';

// 폴백 객체 정의 (기존 함수 그대로 사용)
const createUnavailableIap = () => ({
  connectAsync: async () => ({ responseCode: 0 }),
  disconnectAsync: async () => {},
  getProductsAsync: async () => ({ responseCode: 0, results: [] }),
  requestPurchaseAsync: async () => {
    const error = new Error(IAP_UNAVAILABLE_MESSAGE);
    error.code = 'E_IAP_UNAVAILABLE';
    throw error;
  },
  finishTransactionAsync: async () => {},
  setPurchaseListener: () => ({ remove: () => {} }),
  IAPResponseCode: { OK: 0, USER_CANCELED: 1 },
  InAppPurchaseState: { PURCHASED: 1 },
});

// expo-in-app-purchases를 안전하게 로딩
let InAppPurchases = createUnavailableIap();
export let isIapAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // Snack이나 Expo Go에서는 이 require가 실패합니다.
    InAppPurchases = require('expo-in-app-purchases');
    isIapAvailable = true;
  } catch (error) {
    // 모듈이 없으면 폴백 사용
    InAppPurchases = createUnavailableIap();
    isIapAvailable = false;
  }
}

// default export와 함께 isIapAvailable도 내보냅니다.
export default InAppPurchases;
