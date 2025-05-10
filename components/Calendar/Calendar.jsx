import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

const { BACKEND_URL } = Constants.expoConfig.extra;
const screenWidth = Dimensions.get("window").width;
const DAY_ITEM_SIZE = (screenWidth - 60) / 7; // padding horizontal 30

export default function Calendar({ onDatePress }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [diariesByDate, setDiariesByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const res = await fetch(`${BACKEND_URL}/api/diaries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const map = {};
        json.content.forEach((item) => {
          map[item.diaryDate] = item.representativePhotoUrl;
        });
        setDiariesByDate(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
      >
        <Text style={styles.navText}>{"<"}</Text>
      </TouchableOpacity>
      <Text style={styles.monthText}>{format(currentMonth, "yyyy년 M월")}</Text>
      <TouchableOpacity
        onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
      >
        <Text style={styles.navText}>{">"}</Text>
      </TouchableOpacity>
    </View>
  );

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const renderWeekDays = () => (
    <View style={styles.weekDaysRow}>
      {daysOfWeek.map((day) => (
        <Text key={day} style={styles.weekDayText}>
          {day}
        </Text>
      ))}
    </View>
  );

  const generateCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const allDays = eachDayOfInterval({ start, end });
    const rows = [];
    let cells = [];
    allDays.forEach((day, idx) => {
      if (idx % 7 === 0 && cells.length) {
        rows.push(cells);
        cells = [];
      }
      cells.push(day);
    });
    if (cells.length) rows.push(cells);
    return rows;
  };

  const renderCalendar = () =>
    generateCalendar().map((week, wi) => (
      <View key={wi} style={styles.weekRow}>
        {week.map((day, di) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasPhoto = diariesByDate[dateStr];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          return (
            <TouchableOpacity
              key={di}
              style={styles.dayContainer}
              onPress={() => onDatePress && onDatePress(day)}
              disabled={!isCurrentMonth}
            >
              {hasPhoto ? (
                <Image
                  source={{ uri: diariesByDate[dateStr] }}
                  style={styles.dayImage}
                />
              ) : (
                <View style={styles.dayPlaceholder} />
              )}
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.inactiveDayText,
                ]}
              >
                {format(day, "d")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderWeekDays()}
      {renderCalendar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    margin: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  navText: { fontSize: 20, color: "#A78C7B" },
  monthText: { fontSize: 18, fontWeight: "bold", color: "#A78C7B" },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  weekDayText: {
    width: DAY_ITEM_SIZE,
    textAlign: "center",
    fontWeight: "600",
    color: "#A78C7B",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayContainer: {
    width: DAY_ITEM_SIZE,
    height: DAY_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayImage: {
    width: DAY_ITEM_SIZE * 0.8,
    height: DAY_ITEM_SIZE * 0.8,
    borderRadius: (DAY_ITEM_SIZE * 0.8) / 2,
    position: "absolute",
  },
  dayPlaceholder: {
    width: DAY_ITEM_SIZE * 0.8,
    height: DAY_ITEM_SIZE * 0.8,
    borderRadius: (DAY_ITEM_SIZE * 0.8) / 2,
    backgroundColor: "transparent",
    position: "absolute",
  },
  dayText: { fontSize: 12, color: "#CFAFB5" },
  inactiveDayText: { color: "#F3D9DC" },
});
