// app/settings/_layout.js
import React from "react";
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FCF9F4" },
      }}
    />
  );
}
