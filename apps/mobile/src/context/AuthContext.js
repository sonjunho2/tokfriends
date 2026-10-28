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

const normalizeAuthUser = (user) => {
  if (!user) return null;
  const bal = user.pointBalance ?? user.pointsBalance ?? user.points ?? user.balance ?? 0;
  const numBal = Number(bal) || 0;
  return {
    ...user,
    pointBalance: numBal,
    pointsBalance: numBal,
    points: numBal,
    balance: numBal,
    spendableBalance: numBal,
  };
};

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
        const cachedUser = normalizeAuthUser(await getStoredUser());

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
              let finalBal = me.pointBalance ?? me.pointsBalance ?? me.points ?? me.balance;
              try {
                const balRes = await apiClient.getPointBalance();
                if (typeof balRes?.balance === 'number') {
                  finalBal = balRes.balance;
                }
              } catch {}
              const normalized = normalizeAuthUser({ ...me, pointBalance: finalBal });
              setState((s) => ({ ...s, user: normalized, isOffline: false, initializing: false }));
              await saveStoredUser(normalized);
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
    const normalized = normalizeAuthUser(user);
    try {
      if (token) await saveToken(token);
      if (normalized) await saveStoredUser(normalized);
    } catch {}
    setState((s) => ({ ...s, user: normalized, token: token || s.token }));
  };

  const authenticateWithToken = async (token, userPayload = null) => {
    try {
      if (!token) throw new Error('토큰이 필요합니다.');
      await saveToken(token);
      setState((s) => ({ ...s, token, isOffline: false }));

      // 1. 이미 userPayload(id, nickname 등)가 존재하면 즉시 세션 활성화
      let normalized = normalizeAuthUser(userPayload);
      if (normalized && (normalized.id || normalized._id || normalized.nickname)) {
        await saveStoredUser(normalized);
        setState((s) => ({ ...s, user: normalized, initializing: false }));
      }

      // 2. 백엔드에서 최신 프로필 갱신 시도 (실패해도 초기 유저 세션 유지)
      try {
        const me = await apiClient.getMe();
        if (me) {
          let finalBal = me.pointBalance ?? me.pointsBalance ?? me.points ?? me.balance;
          try {
            const balRes = await apiClient.getPointBalance();
            if (typeof balRes?.balance === 'number') {
              finalBal = balRes.balance;
            }
          } catch {}
          normalized = normalizeAuthUser({ ...me, pointBalance: finalBal });
          if (normalized) {
            await saveStoredUser(normalized);
            setState((s) => ({ ...s, user: normalized, initializing: false }));
          }
        }
      } catch (meErr) {
        console.warn('Failed to fetch getMe in authenticateWithToken, keeping initial user payload:', meErr?.message);
        if (!normalized) {
          throw meErr;
        }
      }

      registerPushNotifications().catch(() => {});
      return { success: true, user: normalized };
    } catch (e) {
      return { success: false, error: e?.message || '세션 설정에 실패했습니다.' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.login(email, password);
      const token = res?.access_token || res?.token || res?.accessToken || res?.data?.token || res?.data?.accessToken;
      if (!token) throw new Error('토큰 응답이 비어 있습니다.');
      return await authenticateWithToken(token, res?.user || res?.data?.user);
    } catch (e) {
      return { success: false, error: e?.message || '아이디 또는 비밀번호를 확인해 주세요.' };
    }
  };

  const testLogin = async () => {
    try {
      const res = await apiClient.testLogin();
      const token =
        res?.token ||
        res?.accessToken ||
        res?.access_token ||
        res?.data?.token ||
        res?.data?.accessToken ||
        res?.data?.access_token;
      if (!token) throw new Error('테스트 로그인 토큰 발급에 실패했습니다.');
      const user = res?.user || res?.data?.user;
      return await authenticateWithToken(token, user);
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
    // 1. 푸시 알림 등록 해제는 비동기로 넘겨 타임아웃 지연(10초) 방지
    unregisterPushNotifications().catch(() => {});
    // 2. 토큰 및 캐시 유저 즉시 제거
    try { await clearToken(); } catch {}
    try { await clearStoredUser(); } catch {}
    // 3. 인증 상태 즉시 리셋 -> 0.01초 만에 로그인 화면 전환
    setState({ user: null, token: null, initializing: false, isOffline: false });
  };

  const refreshMe = async () => {
    if (!state.token) return;
    try {
      const me = await apiClient.getMe();
      if (me) {
        let finalBal = me.pointBalance ?? me.pointsBalance ?? me.points ?? me.balance;
        try {
          const balRes = await apiClient.getPointBalance();
          if (typeof balRes?.balance === 'number') {
            finalBal = balRes.balance;
          }
        } catch {}
        const normalized = normalizeAuthUser({ ...me, pointBalance: finalBal });
        await saveStoredUser(normalized);
        setState((s) => ({ ...s, user: normalized, isOffline: false }));
        return normalized;
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
