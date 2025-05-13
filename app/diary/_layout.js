// app/diaries/_layout.js
import React from "react";
import { Stack } from "expo-router";

export default function DiaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FCF9F4" },
      }}
    />
  );
}
