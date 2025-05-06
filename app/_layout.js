// app/_layout.js
import React from "react";
import { Slot, Redirect, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const openSegment = segments[0]; // e.g. 'login', 'home', 'terms'

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user && openSegment !== "login" && openSegment !== "terms") {
    return <Redirect href="/login" />;
  }

  if (user && !openSegment) {
    return <Redirect href="/home" />;
  }
  if (user && openSegment === "login") {
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
