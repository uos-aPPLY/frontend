// app/settings/_layout.js
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* /settings/index.js */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* onboarding 폴더에 있는 컴포넌트를 proxy로 불러옵니다 */}
      <Stack.Screen
        name="speechstyle"
        options={{ title: "말투 커스터마이징" }}
      />
      {/* 구독 내역 스크린 */}
      <Stack.Screen name="subscriptions" options={{ title: "구독 내역" }} />
      {/* 필요에 따라 다른 /settings 하위 스크린도 등록 */}
      <Stack.Screen name="help" options={{ title: "문의하기" }} />
      <Stack.Screen
        name="termofservice"
        options={{ title: "서비스 이용약관" }}
      />
      <Stack.Screen
        name="privacypolicy"
        options={{ title: "개인정보처리방침" }}
      />
      <Stack.Screen name="waste" options={{ title: "휴지통" }} />
      <Stack.Screen
        name="defaultkeywords"
        options={{ title: "기본 키워드 설정" }}
      />
    </Stack>
  );
}
