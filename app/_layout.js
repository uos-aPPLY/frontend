// app/_layout.js
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DiaryProvider } from "../contexts/DiaryContext";

function RootLayoutNav() {
  const { user, loading, checkRequiredAgreed } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const openSegment = segments[0] ?? "";

  useEffect(() => {
    if (loading) return;

    const redirectByTerms = async () => {
      // 1) 비로그인 시
      if (
        !user &&
        !["login", "terms", "nickname", "speechstyle", "tutorial"].includes(
          openSegment
        )
      ) {
        router.replace("/login");
        return;
      }

      // 로그인했으면 필수약관 동의 상태 확인
      const requiredAgreed = user ? await checkRequiredAgreed() : false;

      // 2) 로그인했지만 필수약관 동의 전, terms 제외 모든 경로 금지
      if (user && !requiredAgreed && openSegment !== "terms") {
        router.replace("/terms");
        return;
      }

      // 3) 로그인 & 필수약관 동의 완료 시, 루트 또는 login 접근은 home으로
      if (
        user &&
        requiredAgreed &&
        (openSegment === "" || openSegment === "login")
      ) {
        router.replace("/home");
        return;
      }
    };

    redirectByTerms();
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
