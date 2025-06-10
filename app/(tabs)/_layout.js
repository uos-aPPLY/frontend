// app/(tabs)/_layout.js
import { Tabs, useSegments, Stack } from "expo-router";
import { Image } from "react-native";
import HomeIcon from "../../assets/icons/homeicon.png";
import CalendarIcon from "../../assets/icons/calendaricon.png";
import ProfileIcon from "../../assets/icons/profileicon.png";
import { StackActions } from "@react-navigation/native";

export default function TabsLayout() {
  const segments = useSegments();
  const isSettingsScreen =
    segments.length >= 3 && segments[1] === "profile" && segments[2] === "settings";

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#a78c7b",
          tabBarInactiveTintColor: "#d9d9d9",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#FCF9F4",
            borderTopWidth: 0,
            height: 100,
            paddingBottom: 60,
            paddingTop: 15,
            display: isSettingsScreen ? "none" : "flex"
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Image source={HomeIcon} style={{ width: size, height: size, tintColor: color }} />
            )
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={CalendarIcon}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Image source={ProfileIcon} style={{ width: size, height: size, tintColor: color }} />
            )
          }}
        />
      </Tabs>
    </>
  );
}
