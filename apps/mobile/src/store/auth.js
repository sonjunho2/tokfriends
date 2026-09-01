import React from 'react';
import { useAuth } from '../context/AuthContext';

// 기존 authStore 사용하는 컴포넌트들을 위한 호환성 래퍼
class AuthStoreCompat {
  constructor() {
    this.listeners = new Set();
    this._authContext = null;
  }

  setAuthContext(authContext) {
    this._authContext = authContext;
  }

  get user() {
    return this._authContext?.user || null;
  }

  get token() {
    return this._authContext?.token || null;
  }

  get loading() {
    return this._authContext?.initializing || false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // 현재 상태로 즉시 호출
    if (this._authContext) {
      listener({
        user: this._authContext.user,
        token: this._authContext.token,
        loading: this._authContext.initializing,
      });
    }
    return () => this.listeners.delete(listener);
  }

  notify() {
    if (!this._authContext) return;
    this.listeners.forEach(listener => listener({
      user: this._authContext.user,
      token: this._authContext.token,
      loading: this._authContext.initializing,
    }));
  }

  async login(credentials) {
    if (!this._authContext) return { success: false, error: 'Auth context not available' };
    return await this._authContext.login(credentials.email, credentials.password);
  }

  async signup(userData) {
    if (!this._authContext) return { success: false, error: 'Auth context not available' };
    return await this._authContext.signup(userData);
  }

  async logout() {
    if (!this._authContext) return;
    await this._authContext.logout();
  }

  async refreshUser() {
    if (!this._authContext) return;
    await this._authContext.refreshMe();
  }
}

const authStore = new AuthStoreCompat();

// Hook to connect authStore with AuthContext
export const useAuthStoreSync = () => {
  const authContext = useAuth();
  
  React.useEffect(() => {
    authStore.setAuthContext(authContext);
    authStore.notify();
  }, [authContext.user, authContext.token, authContext.initializing]);
};

export default authStore;
