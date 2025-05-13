// components/Calendar/CalendarGrid.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import {
  useFonts as useCaveatFonts,
  Caveat_600SemiBold,
} from "@expo-google-fonts/caveat";
import {
  useFonts as useInterFonts,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

const screenWidth = Dimensions.get("window").width;
const DAY_ITEM_SIZE = (screenWidth - 60) / 7;
const screenHeight = Dimensions.get("window").height;

export default function CalendarGrid({
  currentMonth,
  diariesByDate,
  onDatePress,
}) {
  const [fontsCaveatLoaded] = useCaveatFonts({
    Caveat_600SemiBold,
  });
  const [fontsInterLoaded] = useInterFonts({
    Inter_600SemiBold,
  });
  if (!fontsCaveatLoaded || !fontsInterLoaded) {
    return <View />;
  }

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayHasDiary = Boolean(diariesByDate[todayStr]);

  const generateCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const allDays = eachDayOfInterval({ start, end });
    const rows = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    return rows;
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View style={[styles.container, { minHeight: screenHeight * 0.44 }]}>
      <View style={styles.weekDaysRow}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {generateCalendar().map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasPhoto = Boolean(diariesByDate[dateStr]);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isFuture =
              day >
              new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const opacityStyle = isFuture ? { opacity: 0.3 } : null;

            return (
              <TouchableOpacity
                key={di}
                style={[styles.dayContainer, opacityStyle]}
                onPress={() => onDatePress && onDatePress(day)}
                disabled={!isCurrentMonth}
              >
                {isToday && !todayHasDiary ? (
                  <Image
                    source={require("../../assets/icons/bigpinkplusicon.png")}
                    style={styles.plusIcon}
                  />
                ) : hasPhoto ? (
                  <Image
                    source={{ uri: diariesByDate[dateStr] }}
                    style={styles.dayImage}
                  />
                ) : (
                  <View style={styles.dayPlaceholder} />
                )}

                {!(isToday && !todayHasDiary) && (
                  <Text
                    style={[
                      styles.dayText,
                      !isCurrentMonth && styles.inactiveDayText,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFEFE",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    width: "100%",
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  weekDayText: {
    width: DAY_ITEM_SIZE,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#A78C7B",
    fontFamily: "Caveat_600SemiBold",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  dayContainer: {
    width: DAY_ITEM_SIZE,
    height: DAY_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayImage: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
    position: "absolute",
  },
  dayPlaceholder: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
    backgroundColor: "transparent",
    position: "absolute",
  },
  dayText: {
    fontSize: 18,
    color: "rgba(214, 128, 137, 0.7)",
    fontFamily: "Inter_600SemiBold",
  },
  inactiveDayText: {
    color: "#F3D9DC",
  },
  plusIcon: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
  },
});
