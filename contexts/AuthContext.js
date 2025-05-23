// contexts/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;
const AuthContext = createContext();

const SEC_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
};

const originalFetch = global.fetch;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기에 SecureStore 에서 토큰 꺼내오기
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(
          SEC_KEYS.ACCESS_TOKEN
        );
        setToken(storedToken);
        if (storedToken) {
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

  // refreshToken 으로 accessToken 재발급
  const _refreshAccessToken = async () => {
    const storedRefresh = await SecureStore.getItemAsync(
      SEC_KEYS.REFRESH_TOKEN
    );
    if (!storedRefresh) throw new Error("No refresh token stored");
    const res = await originalFetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    });
    if (!res.ok) throw new Error("Refresh token request failed");

    const { accessToken: newToken, refreshToken: newRefresh } =
      await res.json();

    // SecureStore 및 state 업데이트
    await SecureStore.setItemAsync(SEC_KEYS.ACCESS_TOKEN, String(newToken));
    if (newRefresh != null) {
      await SecureStore.setItemAsync(
        SEC_KEYS.REFRESH_TOKEN,
        String(newRefresh)
      );
    }
    setToken(newToken);
    console.log("Refreshed new token: ", newToken);
    return newToken;
  };

  // 401 이 뜨면 한 번만 _refreshAccessToken 후 재시도
  const authFetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const skipRefreshPaths = [
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/terms",
    ];
    if (skipRefreshPaths.some((path) => url.endsWith(path))) {
      return originalFetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
    }
    let res = await originalFetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    if (res.status === 401) {
      const newToken = await _refreshAccessToken();
      res = await originalFetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
    return res;
  };

  // 프로필 조회에도 동일 로직 적용
  const _fetchProfile = async (t) => {
    let res = await originalFetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401) {
      const newToken = await _refreshAccessToken();
      res = await originalFetch(`${BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    }
    return res.ok && res.headers.get("content-type")?.includes("json")
      ? res.json()
      : null;
  };

  // 로그인 직후 호출
  const saveToken = async ({ accessToken, refreshToken }) => {
    if (typeof accessToken !== "string") {
      throw new Error("Invalid accessToken type");
    }
    await SecureStore.setItemAsync(SEC_KEYS.ACCESS_TOKEN, accessToken);
    setToken(accessToken);

    if (refreshToken != null) {
      await SecureStore.setItemAsync(
        SEC_KEYS.REFRESH_TOKEN,
        String(refreshToken)
      );
    }

    const profile = await _fetchProfile(accessToken);
    setUser(profile);
    return profile;
  };

  useEffect(() => {
    global.fetch = authFetch;
    return () => {
      global.fetch = originalFetch;
    };
  }, [authFetch]);

  const fetchTerms = async () => {
    const res = await authFetch(`${BACKEND_URL}/api/terms`);
    if (!res.ok) throw new Error("약관 목록 조회 실패");
    return res.json();
  };

  const submitAgreements = async (agreements) => {
    const res = await authFetch(`${BACKEND_URL}/api/terms/agreements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreements }),
    });
    if (!res.ok) throw new Error("약관 동의 제출 실패");
    setUser((u) => ({ ...u, hasAgreedToTerms: true }));
  };

  const checkRequiredAgreed = async () => {
    const res = await authFetch(
      `${BACKEND_URL}/api/terms/agreements/check-required`
    );
    if (!res.ok) return false;
    return res.json();
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(SEC_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SEC_KEYS.REFRESH_TOKEN);
    setUser(null);
    setToken(null);
  };

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
      authFetch,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
