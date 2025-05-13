// components/Calendar/MonthNavigator.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { addMonths, subMonths, format } from "date-fns";
import {
  useFonts as useInterFonts,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";

export default function MonthNavigator({ currentMonth, onPrev, onNext }) {
  const router = useRouter();
  const [fontsInterLoaded] = useInterFonts({
    Inter_600SemiBold,
  });
  if (!fontsInterLoaded) {
    return null;
  }

  const monthParam = format(currentMonth, "yyyy-MM");

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onPrev} style={styles.iconButton}>
        <Image
          source={require("../../assets/icons/forwardicon.png")}
          style={[styles.icon, styles.backIcon]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push(`/diaries/${monthParam}`)}
        style={styles.monthButton}
      >
        <Text style={styles.monthText}>{format(currentMonth, "M월")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext}>
        <Text style={styles.iconButton}>
          <Image
            source={require("../../assets/icons/forwardicon.png")}
            style={styles.icon}
          />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    width: 14,
    height: 24,
    resizeMode: "contain",
  },
  backIcon: {
    transform: [{ scaleX: -1 }],
  },
  monthText: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#A78C7B",
    marginHorizontal: 20,
  },
  monthButton: {},
});
