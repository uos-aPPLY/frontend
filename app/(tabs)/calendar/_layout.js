// app/(tabs)/calendar/_layout.js
import { Stack } from "expo-router";

export default function CalendarLayout() {
  return (
    <Stack options={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[month]" options={{ headerShown: false }} />
    </Stack>
  );
}
