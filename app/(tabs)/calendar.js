// app/(tabs)/calendar.js
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { addMonths, subMonths } from "date-fns";
import HeaderCalender from "../../components/Header/HeaderCalendar";
import MonthNavigator from "../../components/Calendar/MonthNavigator";
import CalendarGrid from "../../components/Calendar/CalendarGrid";

const { BACKEND_URL } = Constants.expoConfig.extra;

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

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <HeaderCalender />
      </View>
      <View style={styles.calendarContainer}>
        <MonthNavigator
          currentMonth={currentMonth}
          onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        <View style={styles.gridWrapper}>
          <CalendarGrid
            currentMonth={currentMonth}
            diariesByDate={diariesByDate}
            onDatePress={onDatePress}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  headerWrapper: {
    paddingBottom: 30,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  gridWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
});
