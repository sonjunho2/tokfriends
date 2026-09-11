export const IAP_UNAVAILABLE_MESSAGE =
  '현재 결제 모듈을 업그레이드 중입니다. 잠시 후 다시 이용해 주세요.';

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

export const isIapAvailable = false;

export default createUnavailableIap();
