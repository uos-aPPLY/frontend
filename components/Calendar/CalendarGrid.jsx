// components/Calendar/CalendarGrid.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
} from "react-native";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
} from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts as useCaveatFonts,
  Caveat_600SemiBold,
} from "@expo-google-fonts/caveat";
import {
  useFonts as useInterFonts,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";
import { useDiary } from "../../contexts/DiaryContext";
import { CalendarViewContext } from "../../contexts/CalendarViewContext";
import characterList from "../../assets/characterList";

const screenWidth = Dimensions.get("window").width;
const DAY_ITEM_SIZE = (screenWidth - 60) / 7;
const screenHeight = Dimensions.get("window").height;
const TIMEZONE = "Asia/Seoul";

const toSeoulDate = (date) =>
  new Date(
    date.toLocaleString("sv", {
      timeZone: TIMEZONE,
    })
  );

export default function CalendarGrid({
  currentMonth,
  diariesByDate,
  onPrev,
  onNext,
}) {
  const router = useRouter();
  const { selectedDate, setSelectedDate } = useDiary();
  const { showEmotion } = useContext(CalendarViewContext);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) =>
          Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
        onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
          Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
        onPanResponderRelease: (_, { dx }) => {
          if (dx > 50) {
            onPrev?.();
          } else if (dx < -50) {
            onNext?.();
          }
        },
      }),
    [onPrev, onNext]
  );

  const [fontsCaveatLoaded] = useCaveatFonts({
    Caveat_600SemiBold,
  });
  const [fontsInterLoaded] = useInterFonts({
    Inter_600SemiBold,
  });
  if (!fontsCaveatLoaded || !fontsInterLoaded) {
    return <View />;
  }

  const todaySeoul = toSeoulDate(new Date());
  const todayStr = format(todaySeoul, "yyyy-MM-dd");
  const todayHasDiary = Boolean(diariesByDate[todayStr]);

  const generateCalendar = () => {
    const monthStart = toSeoulDate(startOfMonth(currentMonth));
    const monthEnd = toSeoulDate(endOfMonth(currentMonth));
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const allDays = eachDayOfInterval({ start, end });
    const rows = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    return rows;
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.container, { minHeight: screenHeight * 0.44 }]}
    >
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
            const daySeoul = toSeoulDate(day);
            const dateStr = format(daySeoul, "yyyy-MM-dd");
            const entry = diariesByDate[dateStr] || null;
            const hasDiary = Boolean(entry);
            const isCurrentMonth = isSameMonth(daySeoul, currentMonth);
            const isToday = dateStr === todayStr;
            const isFuture = daySeoul > todaySeoul;
            const isPast = !isFuture && !isToday;
            const isPastNoDiary = isPast && !hasDiary;
            const opacityStyle = isFuture ? { opacity: 0.3 } : null;

            let emotionSource = null;
            if (showEmotion && hasDiary && entry.emotionIcon) {
              const found = characterList.find(
                (c) => c.name === entry.emotionIcon
              );
              emotionSource = found?.source ?? null;
            }

            const hasRepresentativePhoto =
              hasDiary && entry.representativePhotoUrl;

            const handlePress = () => {
              if (hasDiary) {
                router.push(`/diary/${dateStr}`);
              } else if (isPastNoDiary) {
                if (selectedDate === dateStr) {
                  setSelectedDate(dateStr);
                  router.push(`/create?date=${dateStr}&from=calendar`);
                } else {
                  setSelectedDate(dateStr);
                }
              } else if (isToday && !todayHasDiary) {
                router.push(`/create?date=${dateStr}&from=calendar`);
              }
            };

            return (
              <TouchableOpacity
                key={di}
                style={[styles.dayContainer, opacityStyle]}
                onPress={handlePress}
                disabled={!isCurrentMonth}
              >
                {showEmotion && emotionSource ? (
                  <Image source={emotionSource} style={styles.dayEmotionIcon} />
                ) : isToday && !todayHasDiary && selectedDate !== dateStr ? (
                  <Image
                    source={require("../../assets/icons/bigpinkplusicon.png")}
                    style={styles.plusIcon}
                  />
                ) : hasDiary ? (
                  hasRepresentativePhoto ? (
                    <Image
                      source={{ uri: entry.representativePhotoUrl }}
                      style={styles.dayImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={["#dad4ec", "#dad4ec", "#f3e7e9"]}
                      locations={[0, 0.01, 1]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={styles.dayStandardBackground}
                    />
                  )
                ) : selectedDate === dateStr ? (
                  <Image
                    source={require("../../assets/icons/grayplusicon.png")}
                    style={styles.plusIcon}
                  />
                ) : (
                  <View style={styles.dayPlaceholder} />
                )}

                {(!showEmotion || !hasDiary) &&
                  selectedDate !== dateStr &&
                  !(isToday && !todayHasDiary) && (
                    <Text
                      style={[
                        styles.dayText,

                        !isCurrentMonth && styles.inactiveDayText,
                      ]}
                    >
                      {format(daySeoul, "d")}
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
  dayEmotionIcon: {
    width: DAY_ITEM_SIZE * 0.85,
    height: DAY_ITEM_SIZE * 0.85,
    position: "contain",
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
  dayStandardBackground: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
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
