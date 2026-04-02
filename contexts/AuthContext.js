// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;
const AuthContext = createContext();

const REFRESH_THRESHOLD_MS = 60 * 1000;
const DEFAULT_EXP_SEC = 60 * 15;

const SEC_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ACCESS_EXP: "accessExp",
  REFRESH_EXP: "refreshExp",
  HAS_COMPLETED_TUTORIAL: "hasCompletedTutorial",
  HAS_CREATED_FIRST_DIARY: "hasCreatedFirstDiary"
};

const originalFetch = global.fetch;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(null);
  const refreshingPromiseRef = useRef(null);

  const _getStoredAccessExp = async () =>
    Number(await SecureStore.getItemAsync(SEC_KEYS.ACCESS_EXP)) || 0;

  const _shouldRefresh = async () => {
    const exp = await _getStoredAccessExp();
    return Date.now() > exp - REFRESH_THRESHOLD_MS;
  };

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const _clearSession = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SEC_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SEC_KEYS.ACCESS_EXP),
      SecureStore.deleteItemAsync(SEC_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(SEC_KEYS.REFRESH_EXP)
    ]);
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  }, []);

  // refreshToken 으로 accessToken 재발급
  const _refreshAccessToken = useCallback(async () => {
    if (refreshingPromiseRef.current) return refreshingPromiseRef.current;

    refreshingPromiseRef.current = (async () => {
      const storedRefresh = await SecureStore.getItemAsync(SEC_KEYS.REFRESH_TOKEN);
      const refreshExp = Number(await SecureStore.getItemAsync(SEC_KEYS.REFRESH_EXP)) || 0;

      if (!storedRefresh) {
        await _clearSession();
        throw new Error("No refresh token stored");
      }

      if (refreshExp > 0 && Date.now() >= refreshExp) {
        await _clearSession();
        throw new Error("Refresh token expired");
      }

      try {
        const res = await originalFetch(`${BACKEND_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh })
        });
        if (!res.ok) {
          await _clearSession();
          throw new Error("Refresh token request failed");
        }

        const {
          accessToken: newToken,
          accessTokenExpiresIn,
          refreshToken: newRefresh,
          refreshTokenExpiresIn: newRefreshExpiresIn
        } = await res.json();

        if (typeof newToken !== "string" || newToken.length === 0) {
          await _clearSession();
          throw new Error("Invalid refresh response");
        }

        const expMs = Date.now() + (accessTokenExpiresIn ?? DEFAULT_EXP_SEC) * 1000;

        await SecureStore.setItemAsync(SEC_KEYS.ACCESS_TOKEN, String(newToken));
        await SecureStore.setItemAsync(SEC_KEYS.ACCESS_EXP, String(expMs));
        if (newRefresh != null) {
          await SecureStore.setItemAsync(SEC_KEYS.REFRESH_TOKEN, String(newRefresh));
        }
        if (newRefreshExpiresIn != null) {
          const refreshExpMs = Date.now() + Number(newRefreshExpiresIn) * 1000;
          await SecureStore.setItemAsync(SEC_KEYS.REFRESH_EXP, String(refreshExpMs));
        }

        tokenRef.current = newToken;
        setToken(newToken);

        return newToken;
      } catch (error) {
        if (
          error.message === "Refresh token request failed" ||
          error.message === "Refresh token expired" ||
          error.message === "Invalid refresh response"
        ) {
          throw error;
        }

        throw new Error(error.message || "Refresh token request failed");
      }
    })();

    try {
      return await refreshingPromiseRef.current;
    } finally {
      refreshingPromiseRef.current = null;
    }
  }, [_clearSession]);

  // 프로필 조회에도 동일 로직 적용
  const _fetchProfile = useCallback(async (t) => {
    let res = await originalFetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    if (res.status === 401) {
      const newToken = await _refreshAccessToken();
      res = await originalFetch(`${BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
    }
    return res.ok && res.headers.get("content-type")?.includes("json") ? res.json() : null;
  }, [_refreshAccessToken]);

  const _resolveAccessToken = useCallback(async () => {
    const storedToken =
      tokenRef.current ?? (await SecureStore.getItemAsync(SEC_KEYS.ACCESS_TOKEN));

    if (!storedToken) return null;

    if (await _shouldRefresh()) {
      return _refreshAccessToken();
    }

    return storedToken;
  }, [_refreshAccessToken]);

  const _buildHeaders = useCallback((headers, accessToken, shouldAttachAuth) => {
    const nextHeaders = { ...(headers || {}) };

    if (shouldAttachAuth) {
      if (accessToken) {
        nextHeaders.Authorization = `Bearer ${accessToken}`;
      } else {
        delete nextHeaders.Authorization;
      }
    }

    return nextHeaders;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, exp] = await Promise.all([
          SecureStore.getItemAsync(SEC_KEYS.ACCESS_TOKEN),
          _getStoredAccessExp()
        ]);

        if (storedToken) {
          let activeToken = storedToken;

          if (Date.now() > exp - REFRESH_THRESHOLD_MS) {
            activeToken = await _refreshAccessToken();
          } else {
            tokenRef.current = storedToken;
            setToken(storedToken);
          }

          const profile = await _fetchProfile(activeToken);
          setUser(profile);
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [_fetchProfile, _refreshAccessToken]);

  // 401 이 뜨면 한 번만 _refreshAccessToken 후 재시도
  const authFetch = useCallback(async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const skipRefreshPaths = [
      "/api/auth/login",
      "/api/auth/refresh",
      "/health",
      "/maintenance-status"
    ];
    const shouldAttachAuth = !skipRefreshPaths.some((p) => url.endsWith(p));
    const accessToken = shouldAttachAuth ? await _resolveAccessToken() : null;

    let res = await originalFetch(input, {
      ...init,
      headers: _buildHeaders(init.headers, accessToken, shouldAttachAuth)
    });

    if (res.status === 401 && shouldAttachAuth) {
      const newToken = await _refreshAccessToken();
      res = await originalFetch(input, {
        ...init,
        headers: _buildHeaders(init.headers, newToken, true)
      });
    }
    return res;
  }, [_buildHeaders, _refreshAccessToken, _resolveAccessToken]);

  const refetchUser = async () => {
    try {
      const currentToken = await _resolveAccessToken();
      if (currentToken) {
        const profile = await _fetchProfile(currentToken);
        setUser(profile);
      }
    } catch (e) {
      console.error("Refetch user error", e);
    }
  };

  // 로그인 직후 호출
  const saveToken = async ({
    accessToken,
    accessTokenExpiresIn,
    refreshToken,
    refreshTokenExpiresIn
  }) => {
    if (typeof accessToken !== "string") {
      throw new Error("Invalid accessToken type");
    }

    const expMs = Date.now() + accessTokenExpiresIn * 1000;

    await SecureStore.setItemAsync(SEC_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(SEC_KEYS.ACCESS_EXP, String(expMs));
    tokenRef.current = accessToken;
    setToken(accessToken);

    if (refreshToken != null) {
      await SecureStore.setItemAsync(SEC_KEYS.REFRESH_TOKEN, String(refreshToken));
    }
    if (refreshTokenExpiresIn != null) {
      const refreshExpMs = Date.now() + Number(refreshTokenExpiresIn) * 1000;
      await SecureStore.setItemAsync(SEC_KEYS.REFRESH_EXP, String(refreshExpMs));
    }

    const profile = await _fetchProfile(accessToken);
    setUser(profile);
    return profile;
  };

  const fetchTerms = async () => {
    const res = await authFetch(`${BACKEND_URL}/api/terms`);
    if (!res.ok) throw new Error("약관 목록 조회 실패");
    return res.json();
  };

  const submitAgreements = async (agreements) => {
    const res = await authFetch(`${BACKEND_URL}/api/terms/agreements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreements })
    });
    if (!res.ok) throw new Error("약관 동의 제출 실패");

    const updatedUser = await res.json();
    setUser(updatedUser);
    return updatedUser;
  };

  const checkRequiredAgreed = async () => {
    const res = await authFetch(`${BACKEND_URL}/api/terms/agreements/check-required`);
    if (!res.ok) return false;
    return res.json();
  };

  const signOut = async () => {
    await _clearSession();
  };

  const deleteAccount = async () => {
    await signOut();
    await SecureStore.deleteItemAsync(SEC_KEYS.HAS_COMPLETED_TUTORIAL);
    await SecureStore.deleteItemAsync(SEC_KEYS.HAS_CREATED_FIRST_DIARY);
  };

  const checkHasCreatedFirstDiary = async () => {
    const hasCreated = await SecureStore.getItemAsync(SEC_KEYS.HAS_CREATED_FIRST_DIARY);
    return hasCreated === "true";
  };

  const markFirstDiaryCreated = async () => {
    await SecureStore.setItemAsync(SEC_KEYS.HAS_CREATED_FIRST_DIARY, "true");
  };

  useEffect(() => {
    global.fetch = authFetch;
    return () => {
      global.fetch = originalFetch;
    };
  }, [authFetch]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      saveToken,
      fetchTerms,
      submitAgreements,
      checkRequiredAgreed,
      signOut,
      deleteAccount,
      authFetch,
      refetchUser,
      checkHasCreatedFirstDiary,
      markFirstDiaryCreated
    }),
    [user, token, loading, _clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
