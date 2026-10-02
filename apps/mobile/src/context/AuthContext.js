import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  apiClient,
  saveToken,
  clearToken,
  getStoredToken,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
} from '../api/client';
import { USE_DUMMY_AUTH } from '../config/env';
import {
  registerPushNotifications,
  unregisterPushNotifications,
} from '../utils/pushNotifications';

const AuthContext = createContext({
  user: null,
  token: null,
  initializing: true,
  isOffline: false,
  setUser: () => {},
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  testLogin: async () => ({ success: false }),
  socialLogin: async () => ({ success: false }),
  authenticateWithToken: async () => ({ success: false }),
  logout: async () => {},
  refreshMe: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    token: null,
    initializing: true,
    isOffline: false,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        let storedToken = await getStoredToken();
        const cachedUser = await getStoredUser();

        if (!storedToken && USE_DUMMY_AUTH) {
          storedToken = 'dummy_token';
          await saveToken(storedToken);
        }

        if (storedToken) {
          // 캐시된 유저가 있으면 초기 화면 깜빡임 없이 즉시 UI 렌더링
          if (isMounted) {
            setState({
              token: storedToken,
              user: cachedUser || null,
              initializing: !cachedUser,
              isOffline: false,
            });
          }

          // 백그라운드에서 최신 유저 프로필 검증 및 동기화
          try {
            const me = await apiClient.getMe();
            if (isMounted && me) {
              setState((s) => ({ ...s, user: me, isOffline: false, initializing: false }));
              await saveStoredUser(me);
              registerPushNotifications().catch(() => {});
            }
          } catch (netErr) {
            const status = netErr?.response?.status || netErr?.status;
            if (status === 401 || status === 403) {
              // 유효하지 않거나 만료된 세션인 경우에만 토큰 정리
              if (!USE_DUMMY_AUTH) {
                await clearToken();
                await clearStoredUser();
                if (isMounted) {
                  setState({ user: null, token: null, initializing: false, isOffline: false });
                }
              }
            } else {
              // 렌더 서버 콜드스타트 / 일시적 오프라인 / 타임아웃 시 세션을 날리지 않고 캐시된 상태 유지
              console.warn('API cold-start or offline during startup; keeping cached user session', netErr?.message);
              if (isMounted) {
                setState((s) => ({ ...s, isOffline: true, initializing: false }));
              }
            }
          }
        } else {
          if (isMounted) {
            setState({ user: null, token: null, initializing: false, isOffline: false });
          }
        }
      } catch (err) {
        console.warn('Auth startup initialization error:', err);
        if (isMounted) {
          setState({ user: null, token: null, initializing: false, isOffline: false });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setUser = async (user, token) => {
    try {
      if (token) await saveToken(token);
      if (user) await saveStoredUser(user);
    } catch {}
    setState((s) => ({ ...s, user: user || null, token: token || s.token }));
  };

  const authenticateWithToken = async (token, userPayload = null) => {
    try {
      if (!token) throw new Error('토큰이 필요합니다.');
      await saveToken(token);
      setState((s) => ({ ...s, token, isOffline: false }));
      const hasCanonicalActivityAccount = Boolean(
        userPayload &&
          typeof userPayload.activityAccountId === 'string' &&
          userPayload.activityAccountId.trim(),
      );
      const me = hasCanonicalActivityAccount
        ? userPayload
        : await apiClient.getMe();
      if (me) {
        await saveStoredUser(me);
      }
      setState((s) => ({ ...s, user: me, initializing: false }));
      registerPushNotifications().catch(() => {});
      return { success: true, user: me };
    } catch (e) {
      return { success: false, error: e?.message || '세션 설정에 실패했습니다.' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.login(email, password);
      const token = res?.access_token || res?.token;
      if (!token) throw new Error('토큰 응답이 비어 있습니다.');
      return await authenticateWithToken(token);
    } catch (e) {
      return { success: false, error: e?.message || '아이디 또는 비밀번호를 확인해 주세요.' };
    }
  };

  const testLogin = async () => {
    try {
      const res = await apiClient.testLogin();
      const token = res?.access_token || res?.token;
      if (!token) throw new Error('테스트 로그인 토큰 발급에 실패했습니다.');
      return await authenticateWithToken(token, res?.user);
    } catch (e) {
      return { success: false, error: e?.message || '테스트 로그인에 실패했습니다.' };
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
    try { await unregisterPushNotifications(); } catch {}
    try { await clearToken(); } catch {}
    try { await clearStoredUser(); } catch {}
    setState({ user: null, token: null, initializing: false, isOffline: false });
  };

  const refreshMe = async () => {
    if (!state.token) return;
    try {
      const me = await apiClient.getMe();
      if (me) {
        await saveStoredUser(me);
        setState((s) => ({ ...s, user: me, isOffline: false }));
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401 || status === 403) {
        await logout();
      } else {
        setState((s) => ({ ...s, isOffline: true }));
      }
    }
  };

  const socialLogin = async (platform, tokenPayload) => {
    try {
      let res;
      if (platform === 'kakao') res = await apiClient.loginKakao(tokenPayload);
      else if (platform === 'naver') res = await apiClient.loginNaver(tokenPayload);
      else if (platform === 'google') res = await apiClient.loginGoogle(tokenPayload);
      else if (platform === 'apple') res = await apiClient.loginApple(tokenPayload);
      else throw new Error(`지원하지 않는 로그인 방식입니다: ${platform}`);

      const token = res?.access_token || res?.token;
      if (!token) throw new Error('토큰 발급에 실패했습니다.');
      return await authenticateWithToken(token, res?.user);
    } catch (e) {
      return { success: false, error: e?.message || `${platform} 로그인에 실패했습니다.` };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        initializing: state.initializing,
        isOffline: state.isOffline,
        setUser,
        login,
        signup,
        testLogin,
        socialLogin,
        authenticateWithToken,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
