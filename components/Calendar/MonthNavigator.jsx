// components/Calendar/MonthNavigator.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { addMonths, subMonths, format } from "date-fns";
import { useFonts as useInterFonts, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";
import YearMonthPicker from "./YearMonthPicker";

export default function MonthNavigator({ currentMonth, onPrev, onNext, onMonthChange }) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);

  const [fontsInterLoaded] = useInterFonts({
    Inter_600SemiBold
  });

  if (!fontsInterLoaded) {
    return null;
  }

  const monthParam = format(currentMonth, "yyyy-MM");

  const handleMonthSelect = (selectedDate) => {
    onMonthChange(selectedDate);
  };

  const handleShortPress = () => {
    // 짧게 누르기: 원래 월 상세 페이지로 이동
    router.push(`/calendar/${monthParam}`);
  };

  const handleLongPress = () => {
    // 길게 누르기: 년/월 선택 모달 열기
    setShowPicker(true);
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onPrev} style={styles.iconButton}>
        <Image
          source={require("../../assets/icons/forwardicon.png")}
          style={[styles.icon, styles.backIcon]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleShortPress}
        onLongPress={handleLongPress}
        style={styles.monthButton}
        delayLongPress={500}
      >
        <Text style={styles.monthText}>{format(currentMonth, "yyyy년 M월")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext}>
        <Text style={styles.iconButton}>
          <Image source={require("../../assets/icons/forwardicon.png")} style={styles.icon} />
        </Text>
      </TouchableOpacity>

      <YearMonthPicker
        visible={showPicker}
        currentMonth={currentMonth}
        onSelect={handleMonthSelect}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10
  },
  iconButton: {
    padding: 8
  },
  icon: {
    width: 14,
    height: 24,
    resizeMode: "contain"
  },
  backIcon: {
    transform: [{ scaleX: -1 }]
  },
  monthText: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#A78C7B",
    marginHorizontal: 20
  },
  monthButton: {}
});
