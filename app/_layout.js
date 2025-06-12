// app/_layout.js
import React, { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DiaryProvider } from "../contexts/DiaryContext";
import { PhotoProvider } from "../contexts/PhotoContext";
import { ServerStatusProvider, useServerStatus } from "../contexts/ServerStatusContext";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import MaintenanceScreen from "../components/MaintenanceScreen";
import DeveloperMenu from "../components/DeveloperMenu";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, checkRequiredAgreed } = useAuth();
  const { serverStatus, isChecking, retryConnection } = useServerStatus();
  const router = useRouter();
  const segments = useSegments();
  const openSegment = segments[segments.length - 1] ?? "";

  // 모든 useEffect를 최상단에 배치 (Hooks 규칙 준수)
  useEffect(() => {
    const redirectByTerms = async () => {
      if (loading) return;
      await SplashScreen.hideAsync();

      const inAuthGroup = segments.includes("(onboarding)");

      if (
        !user &&
        !["login", "terms", "nickname", "speechstyle", "tutorial"].includes(openSegment)
      ) {
        router.replace("/login");
        return;
      }

      const requiredAgreed = await checkRequiredAgreed();
      if (!requiredAgreed) {
        if (openSegment !== "terms") {
          router.replace("/(onboarding)/terms");
        }
        return;
      }

      if (!inAuthGroup && user?.nickname === null) {
        router.replace("/(onboarding)/nickname");
        return;
      }

      if (!inAuthGroup && user.writingStylePrompt === "기본 말투입니다.") {
        router.replace("/(onboarding)/speechstyle");
        return;
      }

      const hasCompletedTutorial = await SecureStore.getItemAsync("hasCompletedTutorial");
      if (!inAuthGroup && !hasCompletedTutorial && openSegment !== "tutorial") {
        router.replace("/(onboarding)/tutorial");
        return;
      }

      if (!inAuthGroup && (openSegment === "" || openSegment === "login")) {
        router.replace("/home");
      }
    };

    redirectByTerms();
  }, [user, loading, openSegment, router, segments]);

  // 디버깅용 로그
  console.log("RootLayoutNav serverStatus:", serverStatus);
  console.log("Maintenance check:", {
    isOnline: serverStatus.isOnline,
    isUnderMaintenance: serverStatus.isUnderMaintenance,
    condition:
      serverStatus.isOnline === null || !serverStatus.isOnline || serverStatus.isUnderMaintenance
  });

  // 서버 상태 확인이 완료되지 않았거나 서버에 문제가 있는 경우
  if (serverStatus.isOnline === null || !serverStatus.isOnline || serverStatus.isUnderMaintenance) {
    console.log("Showing MaintenanceScreen with props:", {
      isUnderMaintenance: serverStatus.isUnderMaintenance,
      isServerDown: serverStatus.isOnline === false,
      maintenanceMessage: serverStatus.maintenanceMessage,
      isRetrying: isChecking
    });

    return (
      <>
        <MaintenanceScreen
          isUnderMaintenance={serverStatus.isUnderMaintenance}
          isServerDown={serverStatus.isOnline === false}
          maintenanceMessage={serverStatus.maintenanceMessage}
          onRetry={retryConnection}
          isRetrying={isChecking}
        />
        <DeveloperMenu />
      </>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#D68089" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      />
      <DeveloperMenu />
    </>
  );
}

export default function RootLayout() {
  return (
    <ServerStatusProvider>
      <AuthProvider>
        <DiaryProvider>
          <PhotoProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PaperProvider>
                <RootLayoutNav />
              </PaperProvider>
            </GestureHandlerRootView>
          </PhotoProvider>
        </DiaryProvider>
      </AuthProvider>
    </ServerStatusProvider>
  );
}
