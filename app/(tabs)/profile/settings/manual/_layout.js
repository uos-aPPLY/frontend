import { Stack } from "expo-router";

export default function ManualLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="main"
        options={{
          headerShown: false,
          gestureEnabled: true
        }}
      />
      <Stack.Screen
        name="fix"
        options={{
          headerShown: false,
          gestureEnabled: true
        }}
      />
      <Stack.Screen
        name="generate"
        options={{
          headerShown: false,
          gestureEnabled: true
        }}
      />
    </Stack>
  );
}
