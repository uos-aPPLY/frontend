// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

async function fetchProfile(token) {
  const res = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 1) JSON 응답이 아닐 경우 파싱 시도 안 함
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    console.warn(
      "프로필 응답이 JSON이 아닙니다. 로그인 페이지로 리다이렉트합니다."
    );
    return null;
  }

  // 2) 상태코드도 체크
  if (!res.ok) {
    console.warn("프로필 조회 실패:", res.status);
    return null;
  }

  // 3) JSON 파싱
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
      } catch (e) {
        console.error("Auth load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveToken = async (token) => {
    await SecureStore.setItemAsync("accessToken", token);
    const profile = await fetchProfile(token);
    setUser(profile || {});
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, saveToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
