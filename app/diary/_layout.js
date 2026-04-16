// app/diary/_layout.js
import { Stack } from "expo-router";

export default function DiaryLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FCF9F4" },
          gestureEnabled: false
        }}
      />
    </>
  );
}
