// app/_layout.js
import { Slot, useSegments } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DiaryProvider } from "../contexts/DiaryContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments(); // ['login'], ['home'], [](=root) 등

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
{/* 개발 중
  if (!user && segments[0] !== "login") {
    return <Redirect href="/login" />;
  }

  if (user && !segments.length) {
    return <Redirect href="/(tabs)" />;
  }

  if (user && segments[0] === "login") {
    return <Redirect href="/(tabs)" />;
  }
*/}

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
