// app/(tabs)/profile/settings/_layout.js
import { Stack } from "expo-router";

export default function SettingsInnerStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="speechstyle" options={{ title: "말투 커스터마이징" }} />
      <Stack.Screen name="help" options={{ title: "문의하기" }} />
      <Stack.Screen name="termofservice" options={{ title: "서비스 이용약관" }} />
      <Stack.Screen name="privacypolicy" options={{ title: "개인정보처리방침" }} />
      <Stack.Screen name="waste" options={{ title: "휴지통" }} />
      <Stack.Screen name="defaultkeywords" options={{ title: "기본 키워드 설정" }} />
    </Stack>
  );
}
