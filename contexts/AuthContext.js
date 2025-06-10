// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
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
  HAS_COMPLETED_TUTORIAL: "hasCompletedTutorial"
};

const originalFetch = global.fetch;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  let refreshingPromise = null;

  const _getStoredAccessExp = async () =>
    Number(await SecureStore.getItemAsync(SEC_KEYS.ACCESS_EXP)) || 0;

  const _shouldRefresh = async () => {
    const exp = await _getStoredAccessExp();
    return Date.now() > exp - REFRESH_THRESHOLD_MS;
  };

  // refreshToken 으로 accessToken 재발급
  const _refreshAccessToken = async () => {
    if (refreshingPromise) return refreshingPromise;

    refreshingPromise = (async () => {
      const storedRefresh = await SecureStore.getItemAsync(SEC_KEYS.REFRESH_TOKEN);
      if (!storedRefresh) throw new Error("No refresh token stored");

      const res = await originalFetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh })
      });
      if (!res.ok) throw new Error("Refresh token request failed");

      const {
        accessToken: newToken,
        accessTokenExpiresIn,
        refreshToken: newRefresh
      } = await res.json();

      const expMs = Date.now() + (accessTokenExpiresIn ?? DEFAULT_EXP_SEC) * 1000;

      await SecureStore.setItemAsync(SEC_KEYS.ACCESS_TOKEN, String(newToken));
      await SecureStore.setItemAsync(SEC_KEYS.ACCESS_EXP, String(expMs));
      if (newRefresh != null) {
        await SecureStore.setItemAsync(SEC_KEYS.REFRESH_TOKEN, String(newRefresh));
      }
      setToken(newToken);

      refreshingPromise = null;
      return newToken;
    })();

    return refreshingPromise;
  };

  // 프로필 조회에도 동일 로직 적용
  const _fetchProfile = async (t) => {
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
  };

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, exp] = await Promise.all([
          SecureStore.getItemAsync(SEC_KEYS.ACCESS_TOKEN),
          _getStoredAccessExp()
        ]);

        if (storedToken) {
          if (Date.now() > exp - REFRESH_THRESHOLD_MS) {
            await _refreshAccessToken();
          } else {
            setToken(storedToken);
          }
          const profile = await _fetchProfile(storedToken);
          setUser(profile);
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 401 이 뜨면 한 번만 _refreshAccessToken 후 재시도
  const authFetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const skipRefreshPaths = ["/api/auth/login", "/api/auth/refresh"];

    if (!skipRefreshPaths.some((p) => url.endsWith(p)) && (await _shouldRefresh())) {
      await _refreshAccessToken();
    }

    let res = await originalFetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined
      }
    });

    if (res.status === 401 && !skipRefreshPaths.some((p) => url.endsWith(p))) {
      const newToken = await _refreshAccessToken();
      res = await originalFetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${newToken}`
        }
      });
    }
    return res;
  };

  const refetchUser = async () => {
    try {
      const currentToken = await SecureStore.getItemAsync(SEC_KEYS.ACCESS_TOKEN);
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
    setToken(accessToken);

    if (refreshToken != null) {
      await SecureStore.setItemAsync(SEC_KEYS.REFRESH_TOKEN, String(refreshToken));
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
    await SecureStore.deleteItemAsync(SEC_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SEC_KEYS.ACCESS_EXP);
    await SecureStore.deleteItemAsync(SEC_KEYS.REFRESH_TOKEN);
    setUser(null);
    setToken(null);
  };

  const deleteAccount = async () => {
    await signOut();
    await SecureStore.deleteItemAsync(SEC_KEYS.HAS_COMPLETED_TUTORIAL);
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
      refetchUser
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
