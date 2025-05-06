// app/_layout.js
import React from "react";
import { Slot, Redirect, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

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

  if (!user && segments[0] !== "login") {
    return <Redirect href="/login" />;
  }

  if (user && !segments.length) {
    return <Redirect href="/home" />;
  }

  if (user && segments[0] === "login") {
    return <Redirect href="/home" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
