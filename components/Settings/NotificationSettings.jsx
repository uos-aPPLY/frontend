// components/Settings/NotificationSettings.jsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import Constants from "expo-constants";
import DatePicker from "react-native-date-picker";
import * as Notifications from "expo-notifications";
import ToggleSwitch from "../ToggleSwitch";
import { useAuth } from "../../contexts/AuthContext";

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

  async function ensurePermissionAndChannel() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
      if (requestedStatus !== "granted") {
        Alert.alert("알림 권한 필요", "설정에서 알림 권한을 허용해 주세요.");
        return false;
      }
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX
      });
    }
    return true;
  }

  async function scheduleDailyNotification(date) {
    const ok = await ensurePermissionAndChannel();
    if (!ok) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📸 사진 찍을 시간이에요!",
        body: "오늘의 소중한 순간을 기록해보세요 ✨",
        sound: "default"
      },
      trigger: {
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats: true,
        ...(Platform.OS === "android" && { channelId: "default" })
      }
    });
    console.log(
      `알림이 ${date.getHours()}시 ${date.getMinutes()}분에 매일 반복되도록 예약되었습니다.`
    );
    return true;
  }

  async function cancelDailyNotification() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async function patchAlarm(enabled, date) {
    try {
      const res = await fetch(`${Constants.expoConfig.extra.BACKEND_URL}/api/users/alarm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          enabled,
          hour: date.getHours(),
          minute: date.getMinutes()
        })
      });
      if (!res.ok) throw new Error();
    } catch {
      Alert.alert("서버 오류", "알림 설정 저장에 실패했습니다.");
    }
  }

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false
      })
    });

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
      const ok = await scheduleDailyNotification(alertTime);
      if (!ok) {
        setPhotoAlertEnabled(false);
        return;
      }
    } else {
      await cancelDailyNotification();
    }
    patchAlarm(enabled, alertTime);
  };

  const handleTimeConfirm = (newTime) => {
    setIsTimePickerVisible(false);
    setAlertTime(newTime);
    if (photoAlertEnabled) {
      scheduleDailyNotification(newTime);
      patchAlarm(true, newTime);
    }
  };

  return (
    <View style={styles.section}>
      <DatePicker
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
        <Text style={styles.itemText}>사진찍기 알림</Text>
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
            {alertTime.getHours() < 12 ? "오전 " : "오후 "}
            {String(alertTime.getHours() % 12 || 12).padStart(2, "0")}:
            {String(alertTime.getMinutes()).padStart(2, "0")}
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
