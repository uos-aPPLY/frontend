// components/Header/HeaderCalendar.jsx
import React, { useEffect, useContext } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useFonts, Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import IconButton from "../IconButton";
import { CalendarViewContext } from "../../contexts/CalendarViewContext";

SplashScreen.preventAutoHideAsync();

export default function Header() {
  const nav = useRouter();
  const { showEmotion, setShowEmotion } = useContext(CalendarViewContext);

  const [fontsLoaded] = useFonts({
    Caveat_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const today = new Date();
  const dateStr = format(today, "yyyy.MM.dd");
  const dayStr = format(today, "EEE");

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Image
          source={require("../../assets/character/char2.png")}
          style={styles.char2}
        />
        <View style={styles.dateWrapper}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.dayText}>{dayStr}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={() => setShowEmotion((prev) => !prev)}
          style={styles.toggleWrapper}
        >
          <Image
            source={
              showEmotion
                ? require("../../assets/icons/righton.png")
                : require("../../assets/icons/leftoff.png")
            }
            style={styles.toggleImage}
          />
        </TouchableOpacity>
        <IconButton
          source={require("../../assets/icons/brownsearchicon.png")}
          hsize={22}
          wsize={22}
          onPress={() => {
            nav.push("/search?from=calendar");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 30,
  },
  char2: {
    width: 44,
    height: 40,
    resizeMode: "contain",
    marginTop: 8,
  },
  dateWrapper: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  dateText: {
    fontFamily: "Caveat_600SemiBold",
    fontSize: 28,
    color: "#AC8B78",
    marginBottom: -10,
  },
  dayText: {
    fontFamily: "Caveat_600SemiBold",
    fontSize: 20,
    color: "#AC8B78",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 20,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 20,
  },
  toggleWrapper: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleImage: {
    width: 30,
    height: 20,
    resizeMode: "contain",
  },
});
