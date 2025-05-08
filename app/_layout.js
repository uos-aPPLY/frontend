// app/_layout.js
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DiaryProvider } from "../contexts/DiaryContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const openSegment = segments[0] ?? "";

  useEffect(() => {
    if (loading) return;

    // 1) 미인증 상태에서 login, onboarding 페이지 외 다른 경로 접근 금지
    if (
      !user &&
      !["login", "terms", "nickname", "speechstyle", "tutorial"].includes(
        openSegment
      )
    ) {
      router.replace("/login");
      return;
    }

    // 2) 인증 후 루트('/')나 '/login' 접근 시 홈으로
    if (user && (openSegment === "" || openSegment === "login")) {
      router.replace("/home");
    }
  }, [user, loading, openSegment, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DiaryProvider>
        <RootLayoutNav />
      </DiaryProvider>
    </AuthProvider>
  );
}
