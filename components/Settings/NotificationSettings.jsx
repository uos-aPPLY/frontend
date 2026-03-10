// components/Settings/NotificationSettings.jsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform, Button } from "react-native";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import ToggleSwitch from "../ToggleSwitch";
import { useAuth } from "../../contexts/AuthContext";

const NOTI_CONTENT = {
  title: "📸 사진 찍을 시간이에요!",
  body: "오늘의 소중한 순간을 기록해보세요 ✨",
  sound: "default"
};

export default function NotificationSettings() {
  const { token } = useAuth();
  const [photoAlertEnabled, setPhotoAlertEnabled] = useState(false);
  const [alertTime, setAlertTime] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  // Helper function to ensure permissions
  async function ensurePermission() {
    const { status } = await Notifications.getPermissionsAsync();
    console.log("현재 알림 권한 상태:", status);

    if (status !== "granted") {
      const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
      if (requestedStatus !== "granted") {
        Alert.alert("알림 권한 필요", "설정에서 알림 권한을 허용해 주세요.");
        return false;
      }
    }
    return true;
  }

  function buildTriggers(baseDate) {
    const hour = baseDate.getHours();
    const minute = baseDate.getMinutes();

    // 반복 트리거
    const dailyTrigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    };

    // 첫 알림 시각 계산 (60초 룰 회피)
    const now = new Date();
    const firstDate = new Date(now);
    firstDate.setHours(hour, minute, 0, 0);
    if (firstDate <= now || firstDate.getTime() - now.getTime() < 60_000) {
      // 오늘 타이밍이 지났거나 60초 미만이면 다음 날
      firstDate.setDate(firstDate.getDate() + 1);
    }

    return {
      oneOff: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: firstDate },
      daily: dailyTrigger
    };
  }

  // Schedules the daily notification
  async function scheduleDailyNotification(date) {
    const hasPermission = await ensurePermission();

    await Notifications.cancelAllScheduledNotificationsAsync();

    const { oneOff, daily } = buildTriggers(date);

    try {
      await Notifications.scheduleNotificationAsync({
        content: NOTI_CONTENT,
        trigger: oneOff
      });

      await Notifications.scheduleNotificationAsync({
        content: NOTI_CONTENT,
        trigger: daily
      });

      console.log(
        `첫 알림: ${new Date(oneOff.date).toLocaleTimeString()} / 이후 매일 ${daily.hour}:${
          daily.minute
        }`
      );

      return true;
    } catch (error) {
      console.error("scheduleNotificationAsync에서 에러 발생:", error);
      return false;
    }
  }

  // Cancels all scheduled notifications
  async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("모든 예약된 알림이 취소되었습니다.");
  }

  // Patches the alarm settings to the backend
  async function patchAlarm(enabled, date) {
    try {
      await fetch(`${Constants.expoConfig.extra.BACKEND_URL}/api/users/alarm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          enabled,
          hour: date.getHours(),
          minute: date.getMinutes()
        })
      });
    } catch (error) {
      console.error("알림 설정 저장 오류:", error);
      Alert.alert("서버 오류", "알림 설정 저장에 실패했습니다.");
    }
  }

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const r = await fetch(`${Constants.expoConfig.extra.BACKEND_URL}/api/users/me`, {
          headers: authHeader
        });
        if (!r.ok) throw new Error("Failed to fetch user data");
        const data = await r.json();

        const enabled = !!data.alarmEnabled;
        const time = new Date();
        if (data.alarmTime) {
          const [h, m] = data.alarmTime.split(":").map(Number);
          time.setHours(h, m, 0, 0);
        } else {
          time.setHours(12, 0, 0, 0);
        }

        setPhotoAlertEnabled(enabled);
        setAlertTime(time);

        if (enabled) {
          console.log("초기 로드: 알림 활성화 상태, 알림 예약 시도.");
          await scheduleDailyNotification(time);
        }
      } catch (error) {
        console.error("알림 설정 로드 오류:", error);
        Alert.alert("오류", "알림 설정을 불러오지 못했습니다.");
      }
    })();
  }, [token]);

  const handleToggle = async (enabled) => {
    setPhotoAlertEnabled(enabled);
    if (enabled) {
      const success = await scheduleDailyNotification(alertTime);
      if (!success) {
        setPhotoAlertEnabled(false);
        return;
      }
    } else {
      await cancelAllNotifications();
    }
    await patchAlarm(enabled, alertTime);
  };

  const handleTimeConfirm = async (newTime) => {
    setIsTimePickerVisible(false);
    setAlertTime(newTime);
    if (photoAlertEnabled) {
      await scheduleDailyNotification(newTime);
      await patchAlarm(true, newTime);
    }
  };

  return (
    <View style={styles.section}>
      <DateTimePicker
        modal
        open={isTimePickerVisible}
        date={alertTime}
        mode="time"
        title="알림 시간 선택"
        confirmText="확인"
        cancelText="취소"
        is24hourSource="locale"
        onConfirm={handleTimeConfirm}
        onCancel={() => setIsTimePickerVisible(false)}
      />

      <Text style={styles.sectionTitle}>알림</Text>

      <View style={styles.itemRow}>
        <Text style={styles.itemText}>매일 설정한 시간에 사진 찍기 알림</Text>
        <ToggleSwitch
          onImage={require("../../assets/icons/righton.png")}
          offImage={require("../../assets/icons/leftoff.png")}
          key={`toggle-${photoAlertEnabled}`}
          initialState={photoAlertEnabled}
          onToggle={handleToggle}
        />
      </View>

      {photoAlertEnabled && (
        <Pressable style={styles.itemRow} onPress={() => setIsTimePickerVisible(true)}>
          <Text style={styles.itemText}>알림 시간</Text>
          <Text style={styles.itemText}>
            {alertTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 30, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#AC8B78",
    borderBottomWidth: 2,
    borderBottomColor: "#A78C7B",
    paddingBottom: 12
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#A78C7B"
  },
  itemText: { fontSize: 16, color: "#A78C78" }
});
