import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { addMonths, subMonths } from "date-fns";
import HeaderCalender from "../../components/Header/HeaderCalendar";
import MonthNavigator from "../../components/Calendar/MonthNavigator";
import CalendarGrid from "../../components/Calendar/CalendarGrid";
import { CalendarViewContext } from "../../contexts/CalendarViewContext";
import { useFocusEffect } from "@react-navigation/native";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function Calendar({ onDatePress }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [diariesByDate, setDiariesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEmotion, setShowEmotion] = useState(false);

  // ✅ fetchDiaries 함수 분리 (withLoading 옵션 추가)
  const fetchDiaries = useCallback(async (withLoading = false) => {
    try {
      if (withLoading) setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`${BACKEND_URL}/api/diaries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const map = {};
      json.content.forEach((item) => {
        map[item.diaryDate] = item;
      });
      setDiariesByDate(map);
    } catch (e) {
      console.error("❌ fetchDiaries 에러:", e);
    } finally {
      if (withLoading) setLoading(false);
    }
  }, []);

  // ✅ 앱 최초 로딩 시 1회
  useEffect(() => {
    fetchDiaries(true);
  }, [fetchDiaries]);

  // ✅ 캘린더 화면에 포커스될 때마다 새로고침 + 30초 주기 인터벌 실행
  useFocusEffect(
    useCallback(() => {
      console.log("📌 캘린더 탭 진입 → fetchDiaries 실행");
      fetchDiaries(false); // 진입 시 1회

      const intervalId = setInterval(() => {
        console.log("⏱ 30초마다 캘린더 새로고침 실행");
        fetchDiaries(false); // 조용한 자동 새로고침
      }, 30000);

      return () => {
        console.log("👋 캘린더 탭 이탈 → 인터벌 제거");
        clearInterval(intervalId);
      };
    }, [fetchDiaries])
  );

  // ✅ 새 일기 생성 이벤트 수신 시 새로고침
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "refreshCalendar",
      () => {
        console.log("📅 새 일기 생성됨 → 캘린더 새로고침");
        fetchDiaries(false);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [fetchDiaries]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <CalendarViewContext.Provider value={{ showEmotion, setShowEmotion }}>
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
              onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
              onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
            />
          </View>
        </View>
      </SafeAreaView>
    </CalendarViewContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  headerWrapper: {
    paddingBottom: 50,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  gridWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 70,
  },
});
