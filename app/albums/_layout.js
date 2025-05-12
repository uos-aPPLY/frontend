// app/albums/_layout.js
import React from "react";
import { Stack } from "expo-router";

export default function AlbumsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 기본 네비게이션 바 숨김
      }}
    />
  );
}
