// app/_layout.js
import React, { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DiaryProvider } from "../contexts/DiaryContext";
import { PhotoProvider } from "../contexts/PhotoContext";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, checkRequiredAgreed } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const openSegment = segments[0] ?? "";

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

      if (user.nickname === null) {
        if (openSegment !== "nickname") {
          router.replace("/(onboarding)/nickname");
        }
        return;
      }

      if (user.writingStylePrompt === "기본 말투입니다.") {
        if (openSegment !== "speechstyle") {
          router.replace("/(onboarding)/speechstyle");
        }
        return;
      }

      const hasCompletedTutorial = await SecureStore.getItemAsync("hasCompletedTutorial");
      if (!hasCompletedTutorial) {
        if (openSegment !== "tutorial") {
          router.replace("/(onboarding)/tutorial");
        }
        return;
      }

      if (inAuthGroup || openSegment === "login" || openSegment === "") {
        router.replace("/home");
      }
    };

    redirectByTerms();
  }, [user, loading, openSegment, router, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#D68089" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    />
  );
}

export default function RootLayout() {
  return (
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
  );
}
