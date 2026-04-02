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
import { useLocalSearchParams } from "expo-router";
import { addMonths, subMonths, format, parseISO } from "date-fns";
import HeaderCalender from "../../../components/Header/HeaderCalendar";
import MonthNavigator from "../../../components/Calendar/MonthNavigator";
import CalendarGrid from "../../../components/Calendar/CalendarGrid";
import { CalendarViewContext } from "../../../contexts/CalendarViewContext";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";
import { useAuth } from "../../../contexts/AuthContext";

const { BACKEND_URL } = Constants.expoConfig.extra;
const CALENDAR_AUTO_REFRESH_MS = 30000;
const FOCUS_REFRESH_DEBOUNCE_MS = 5000;

export default function Calendar({ onDatePress }) {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { date: dateParam } = useLocalSearchParams();
  const initialMonth = dateParam ? parseISO(dateParam) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [diariesByDate, setDiariesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEmotion, setShowEmotion] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);
  const inFlightFetchRef = useRef(null);
  const lastFetchAtRef = useRef(0);

  const fetchDiaries = useCallback(
    async (withLoading = false) => {
      if (inFlightFetchRef.current) {
        return inFlightFetchRef.current;
      }

      const task = (async () => {
        try {
          if (withLoading) setLoading(true);
          if (!token) return;
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
          lastFetchAtRef.current = Date.now();
        } catch (e) {
          console.error("fetchDiaries 에러:", e);
        } finally {
          inFlightFetchRef.current = null;
          if (withLoading) setLoading(false);
        }
      })();

      inFlightFetchRef.current = task;

      try {
        await task;
      } finally {
        if (!withLoading) {
          setLoading(false);
        }
      }
    },
    [currentMonth, token]
  );

  useEffect(() => {
    fetchDiaries(true);
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    fetchDiaries(false);
  }, [currentMonth]);

  // 캘린더 화면에 포커스될 때 새로고침 + 완화된 주기 자동 갱신
  useFocusEffect(
    useCallback(() => {
      const stackNav = navigation.getParent();

      if (stackNav && stackNav.getState()?.type === "stack" && stackNav.getState().index > 0) {
        stackNav.dispatch(StackActions.popToTop());
      }

      if (Date.now() - lastFetchAtRef.current > FOCUS_REFRESH_DEBOUNCE_MS) {
        fetchDiaries(false);
      }

      const intervalId = setInterval(() => {
        fetchDiaries(false);
      }, CALENDAR_AUTO_REFRESH_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, [fetchDiaries, navigation])
  );

  // ✅ 새 일기 생성 이벤트 수신 시 새로고침
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("refreshCalendar", () => {
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
