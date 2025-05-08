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

async function fetchProfile(token) {
  const res = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return await res.json();
}

const AuthContext = createContext();

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

  const agreeToTerms = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) return null;
    const res = await fetch(`${BACKEND_URL}/api/users/me/agree-terms`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("약관 동의 실패");
    setUser((u) => ({ ...u, hasAgreedToTerms: true }));
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, saveToken, agreeToTerms, signOut }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
