// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
          const profile = await fetchProfile(token);
          setUser(profile);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 백엔드 JWT 저장 + 프로필 반환
  const saveToken = async (token) => {
    await SecureStore.setItemAsync("accessToken", token);
    const profile = await fetchProfile(token);
    setUser(profile);
    return profile; // <-- 프로필을 돌려줌
  };

  // 약관 동의 처리
  const agreeToTerms = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) return null;
    const res = await fetch(`${BACKEND_URL}/api/users/me/agree-terms`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("약관 동의 실패");
    // 로컬 유저 상태에도 반영
    setUser((u) => ({ ...u, hasAgreedToTerms: true }));
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, saveToken, agreeToTerms, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
