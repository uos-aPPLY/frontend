// app/_layout.js
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
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
