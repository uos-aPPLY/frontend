// app/(onboarding)/_layout.js
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="terms"
        options={{ title: "약관 동의", headerShown: false }}
      />
      <Stack.Screen
        name="nickname"
        options={{ title: "닉네임 설정", headerShown: false }}
      />
      <Stack.Screen
        name="speechstyle"
        options={{ title: "말투 커스터마이징", headerShown: false }}
      />
      <Stack.Screen
        name="tutorial"
        options={{ title: "튜토리얼", headerShown: false }}
      />
    </Stack>
  );
}
