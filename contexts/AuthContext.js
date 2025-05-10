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

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

async function fetchProfile(token) {
  const r = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: authHeader(token),
  });
  return r.ok && r.headers.get("content-type")?.includes("json")
    ? r.json()
    : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("accessToken");
        if (storedToken) {
          setToken(storedToken);
          const profile = await fetchProfile(storedToken);
          setUser(profile);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveToken = async (newToken) => {
    await SecureStore.setItemAsync("accessToken", newToken);
    setToken(newToken);
    const profile = await fetchProfile(newToken);
    setUser(profile);
    return profile;
  };

  const fetchTerms = async () => {
    const r = await fetch(`${BACKEND_URL}/api/terms`, {
      headers: authHeader(token),
    });
    if (!r.ok) throw new Error("약관 목록 조회 실패");
    return r.json(); // [{id, title, required, ...}, ...]
  };

  const submitAgreements = async (agreements) => {
    const r = await fetch(`${BACKEND_URL}/api/terms/agreements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ agreements }),
    });
    if (!r.ok) throw new Error("약관 동의 제출 실패");
    setUser((u) => ({ ...u, hasAgreedToTerms: true }));
  };

  const checkRequiredAgreed = async () => {
    const r = await fetch(
      `${BACKEND_URL}/api/terms/agreements/check-required`,
      {
        headers: authHeader(token),
      }
    );
    if (!r.ok) return false;
    return (await r.json()) === true;
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("accessToken");
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
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
