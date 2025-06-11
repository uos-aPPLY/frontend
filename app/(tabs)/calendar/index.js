// app/(tabs)/calendar/index.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
  ScrollView,
  RefreshControl
} from "react-native";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams } from "expo-router";
import { addMonths, subMonths, format, parseISO } from "date-fns";
import HeaderCalender from "../../../components/Header/HeaderCalendar";
import MonthNavigator from "../../../components/Calendar/MonthNavigator";
import CalendarGrid from "../../../components/Calendar/CalendarGrid";
import { CalendarViewContext } from "../../../contexts/CalendarViewContext";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function Calendar({ onDatePress }) {
  const navigation = useNavigation();
  const { date: dateParam } = useLocalSearchParams();
  const initialMonth = dateParam ? parseISO(dateParam) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [diariesByDate, setDiariesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEmotion, setShowEmotion] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchDiaries = useCallback(
    async (withLoading = false) => {
      try {
        if (withLoading) setLoading(true);
        const token = await SecureStore.getItemAsync("accessToken");
        const year = format(currentMonth, "yyyy");
        const month = format(currentMonth, "MM");
        const res = await fetch(`${BACKEND_URL}/api/diaries/calendar?year=${year}&month=${month}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const map = {};
        data.forEach((item) => {
          map[item.diaryDate] = item;
        });
        setDiariesByDate(map);
      } catch (e) {
        console.error("fetchDiaries 에러:", e);
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [currentMonth]
  );

  useEffect(() => {
    fetchDiaries(true);
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    fetchDiaries(false);
  }, [currentMonth]);

  // ✅ 캘린더 화면에 포커스될 때마다 새로고침 + 30초 주기 인터벌 실행
  useFocusEffect(
    useCallback(() => {
      const stackNav = navigation.getParent();

      if (stackNav && stackNav.getState()?.type === "stack" && stackNav.getState().index > 0) {
        stackNav.dispatch(StackActions.popToTop());
      }

      console.log("📌 캘린더 탭 진입 → fetchDiaries 실행");
      fetchDiaries(false); // 진입 시 1회

      const intervalId = setInterval(() => {
        console.log("⏱ 8초마다 캘린더 새로고침 실행");
        fetchDiaries(false); // 조용한 자동 새로고침
      }, 8000);

      return () => {
        console.log("👋 캘린더 탭 이탈 → 인터벌 제거");
        clearInterval(intervalId);
      };
    }, [fetchDiaries, navigation])
  );

  // ✅ 새 일기 생성 이벤트 수신 시 새로고침
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("refreshCalendar", () => {
      console.log("📅 새 일기 생성됨 → 캘린더 새로고침");
      fetchDiaries(false);
    });

    return () => {
      subscription.remove();
    };
  }, [fetchDiaries]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await fetchDiaries(false);
      console.log("Refreshing Success!");
    } catch (e) {
      console.error("onRefresh 에러:", e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDiaries]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D68089" />
      </View>
    );
  }

  return (
    <CalendarViewContext.Provider value={{ showEmotion, setShowEmotion }}>
      <View style={styles.container} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={Constants.statusBarHeight}
              tintColor="#D68089"
            />
          }
        >
          <View style={styles.headerWrapper}>
            <HeaderCalender />
          </View>
          <View style={styles.calendarContainer}>
            <MonthNavigator
              currentMonth={currentMonth}
              onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
              onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
              onMonthChange={setCurrentMonth}
            />
            <View style={styles.gridWrapper}>
              <CalendarGrid
                currentMonth={currentMonth}
                diariesByDate={diariesByDate}
                onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
                onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </CalendarViewContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
    color: "#AC8B78"
  },
  scrollContent: { flexGrow: 1 },
  headerWrapper: {
    paddingBottom: 50
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 15
  },
  gridWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 70
  }
});
