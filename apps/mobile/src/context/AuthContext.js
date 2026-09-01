// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, saveToken, clearToken, getStoredToken } from '../api/client';

const AuthContext = createContext({
  user: null,
  token: null,
  initializing: true,
  setUser: () => {},
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  authenticateWithToken: async () => ({ success: false }),
  logout: async () => {},
  refreshMe: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({ user: null, token: null, initializing: true });

  useEffect(() => {
    (async () => {
      try {
        try { await apiClient.health(); } catch {}
        const stored = await getStoredToken();
        if (stored) {
          setState((s) => ({ ...s, token: stored }));
          const me = await apiClient.getMe();
          setState((s) => ({ ...s, user: me }));
        }
      } catch (e) {
        await clearToken();
        setState({ user: null, token: null, initializing: false });
        return;
      }
      setState((s) => ({ ...s, initializing: false }));
    })();
  }, []);

  const setUser = async (user, token) => {
    try {
      if (token) await saveToken(token);
    } catch {}
    setState((s) => ({ ...s, user: user || null, token: token || s.token }));
  };

  const authenticateWithToken = async (token, userPayload = null) => {
    try {
      if (!token) throw new Error('토큰이 필요합니다.');
      await saveToken(token);
      setState((s) => ({ ...s, token }));
      const me = userPayload || (await apiClient.getMe());
      setState((s) => ({ ...s, user: me }));
      return { success: true, user: me };
    } catch (e) {
      return { success: false, error: e?.message || '세션 설정에 실패했습니다.' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.login(email, password);
      const token = res?.access_token;
      if (!token) throw new Error('토큰 응답이 비어 있습니다.');
      return await authenticateWithToken(token);
    } catch (e) {
      return { success: false, error: e?.message || '아이디 또는 비밀번호를 확인해 주세요.' };
    }
  };

  const signup = async (data) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        gender: data.gender || 'other',
        dob: data.dob || '2000-01-01',
      };
      await apiClient.signup(payload);
      const r = await login(payload.email, payload.password);
      if (!r.success) throw new Error(r.error || '자동 로그인 실패');
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || '회원가입에 실패했습니다.' };
    }
  };

  const logout = async () => {
    try { await clearToken(); } catch {}
    setState({ user: null, token: null, initializing: false });
  };

  const refreshMe = async () => {
    if (!state.token) return;
    try {
      const me = await apiClient.getMe();
      setState((s) => ({ ...s, user: me }));
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        initializing: state.initializing,
        setUser,
        login,
        signup,
        authenticateWithToken,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
