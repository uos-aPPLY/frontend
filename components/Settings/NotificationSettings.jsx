// components/Settings/NotificationSettings.jsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform, Modal } from "react-native";
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

function createDefaultAlertTime() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function parseAlarmTime(alarmTime) {
  if (typeof alarmTime !== "string" || !alarmTime.trim()) {
    return createDefaultAlertTime();
  }

  const parts = alarmTime.split(":").map(Number);
  const [hour, minute] = parts;

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return createDefaultAlertTime();
  }

  const time = createDefaultAlertTime();
  time.setHours(hour, minute, 0, 0);

  if (Number.isNaN(time.getTime())) {
    return createDefaultAlertTime();
  }

  return time;
}

export default function NotificationSettings() {
  const { token } = useAuth();
  const [photoAlertEnabled, setPhotoAlertEnabled] = useState(false);
  const [alertTime, setAlertTime] = useState(createDefaultAlertTime);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [draftAlertTime, setDraftAlertTime] = useState(createDefaultAlertTime);

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

    const dailyTrigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    };

    const now = new Date();
    const nextOccurrence = new Date(now);
    nextOccurrence.setHours(hour, minute, 0, 0);
    if (nextOccurrence <= now) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }

    return {
      daily: dailyTrigger,
      nextOccurrence
    };
  }

  // Schedules the daily notification
  async function scheduleDailyNotification(date) {
    const hasPermission = await ensurePermission();
    if (!hasPermission) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const { daily, nextOccurrence } = buildTriggers(date);

    try {
      await Notifications.scheduleNotificationAsync({
        content: NOTI_CONTENT,
        trigger: daily
      });

      console.log(`다음 알림: ${nextOccurrence.toLocaleString()} / 이후 매일 ${daily.hour}:${daily.minute}`);

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
        const time = parseAlarmTime(data.alarmTime);

        setPhotoAlertEnabled(enabled);
        setAlertTime(time);
        setDraftAlertTime(time);

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
    if (!(newTime instanceof Date) || Number.isNaN(newTime.getTime())) return;
    setAlertTime(newTime);
    setDraftAlertTime(newTime);
    if (photoAlertEnabled) {
      await scheduleDailyNotification(newTime);
      await patchAlarm(true, newTime);
    }
  };

  const openTimePicker = () => {
    setDraftAlertTime(alertTime);
    setIsTimePickerVisible(true);
  };

  const handlePickerChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setIsTimePickerVisible(false);
      if (event.type === "set" && selectedDate) {
        handleTimeConfirm(selectedDate);
      }
      return;
    }

    if (selectedDate) {
      setDraftAlertTime(selectedDate);
    }
  };

  return (
    <View style={styles.section}>
      {Platform.OS === "ios" && (
        <Modal
          visible={isTimePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTimePickerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>알림 시간 선택</Text>
              <DateTimePicker
                value={draftAlertTime}
                mode="time"
                display="spinner"
                onChange={handlePickerChange}
              />
              <View style={styles.modalActions}>
                <Pressable onPress={() => setIsTimePickerVisible(false)}>
                  <Text style={styles.modalActionText}>취소</Text>
                </Pressable>
                <Pressable onPress={() => handleTimeConfirm(draftAlertTime)}>
                  <Text style={styles.modalActionText}>확인</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && isTimePickerVisible && (
        <DateTimePicker
          value={alertTime}
          mode="time"
          is24Hour={false}
          onChange={handlePickerChange}
        />
      )}

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
        <Pressable style={styles.itemRow} onPress={openTimePicker}>
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
  itemText: { fontSize: 16, color: "#A78C78" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  modalCard: {
    backgroundColor: "#FFF8F4",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6F584A",
    textAlign: "center",
    marginBottom: 8
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#AC8B78",
    paddingHorizontal: 12,
    paddingVertical: 8
  }
});
