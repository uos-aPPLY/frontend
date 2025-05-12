// app/settings.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import ToggleSwitch from "../components/ToggleSwitch";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import Withdrawal from "../components/Settings/Withdrawal";
import ConfirmModal from "../components/Modal/ConfirmModal";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [photoAlertEnabled, setPhotoAlertEnabled] = useState(false);
  const [alertTime, setAlertTime] = useState(new Date(0, 0, 0, 12, 0));
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const goBack = () => {
    router.replace("/profile");
  };

  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ConfirmModal
        visible={logoutModalVisible}
        title="로그아웃 하시겠어요?"
        message="로그아웃 시 다시 로그인해야 합니다."
        cancelText="취소"
        confirmText="로그아웃"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
      <Pressable onPress={goBack} style={styles.backButton}>
        <Image
          source={require("../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>
      <ScrollView>
        {/* 고객문의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객문의</Text>
          {["문의하기", "서비스 이용약관", "개인정보처리방침"].map((t) => (
            <Pressable
              key={t}
              style={styles.item}
              onPress={() => {
                /* 핸들러 */
              }}
            >
              {({ pressed }) => (
                <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                  {t}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>사진찍기 알림</Text>
            <ToggleSwitch
              onImage={require("../assets/icons/righton.png")}
              offImage={require("../assets/icons/leftoff.png")}
              initialState={photoAlertEnabled}
              onToggle={setPhotoAlertEnabled}
              style={styles.toggleSwitch}
            />
          </View>
          <Pressable style={styles.itemRow}>
            <Text style={styles.itemText}>알림 시간</Text>
            <Text style={styles.itemText}>
              {alertTime.getHours() < 12 ? "오전 " : "오후 "}
              {(alertTime.getHours() % 12 || 12).toString().padStart(2, "0")}:
              {alertTime.getMinutes().toString().padStart(2, "0")}
            </Text>
          </Pressable>
        </View>

        {/* 데이터 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터</Text>
          {[
            "휴지통",
            "말투 커스터마이징",
            "기본 키워드 설정",
            "내보내기 (txt, pdf)",
          ].map((t) => (
            <Pressable
              key={t}
              style={styles.item}
              onPress={() => {
                if (t === "말투 커스터마이징") {
                  router.push("/speechstyle?from=settings");
                }
              }}
            >
              {({ pressed }) => (
                <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                  {t}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <Pressable
            style={styles.item}
            onPress={() => setLogoutModalVisible(true)}
          >
            {({ pressed }) => (
              <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                로그아웃
              </Text>
            )}
          </Pressable>
          <Withdrawal style={styles.item} textStyle={styles.itemText} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4", paddingTop: 26 },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  backButton: {
    position: "absolute",
    top: 80,
    left: 20,
    padding: 8,
    zIndex: 1,
  },
  backicon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#A78C7B",
  },
  section: { paddingHorizontal: 30, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#AC8B78",
    borderBottomWidth: 2,
    borderBottomColor: "#A78C7B",
    paddingBottom: 12,
  },
  item: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#A78C7B",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#A78C7B",
  },
  itemText: {
    fontSize: 16,
    color: "#A78C78",
  },
});
