// app/settings/index.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import Withdrawal from "../../components/Settings/Withdrawal";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import NotificationSettings from "../../components/Settings/NotificationSettings";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
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
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <ScrollView>
        <NotificationSettings />

        {/* 고객문의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객문의</Text>
          {["문의하기", "서비스 이용약관", "개인정보처리방침"].map((t) => {
            let onPress;
            if (t === "문의하기") {
              onPress = () => router.push("/settings/help");
            }
            if (t === "서비스 이용약관")
              onPress = () => router.push("/settings/termofservice");
            if (t === "개인정보처리방침")
              onPress = () => router.push("/settings/privacypolicy");
            return (
              <Pressable key={t} style={styles.item} onPress={onPress}>
                {({ pressed }) => (
                  <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                    {t}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 데이터 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터</Text>
          {["휴지통", "말투 커스터마이징", "기본 키워드 설정"].map((t) => {
            let onPress;
            if (t === "휴지통") {
              onPress = () => router.push("/settings/waste");
            } else if (t === "말투 커스터마이징") {
              onPress = () =>
                router.push("/settings/speechstyle?from=settings");
            } else if (t === "기본 키워드 설정") {
              onPress = () => router.push("/settings/defaultkeywords");
            }

            return (
              <Pressable key={t} style={styles.item} onPress={onPress}>
                {({ pressed }) => (
                  <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                    {t}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <Pressable
            style={styles.item}
            onPress={() => router.push("/settings/subscriptions")}
          >
            {({ pressed }) => (
              <Text style={[styles.itemText, pressed && { opacity: 0.5 }]}>
                구독 내역
              </Text>
            )}
          </Pressable>
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
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  backButton: {
    position: "absolute",
    top: 80,
    left: 30,
    padding: 8,
    zIndex: 1,
  },
  backicon: { width: 12, height: 22 },
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
  itemText: { fontSize: 16, color: "#A78C78" },
});
