import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 3) 만약 /diary/[id] 같이 탭 외에 개별 화면이 필요하다면
          <Stack.Screen name="diary/[id]" options={{ title: '상세' }} />
      */}
    </Stack>
  );
}
