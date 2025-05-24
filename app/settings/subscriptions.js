// app/settings/subscriptions.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ConfirmModal from "../../components/Modal/ConfirmModal";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const goBack = () => {
    router.back();
  };

  const handleUpgradePress = () => {
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    setPaymentModalVisible(false);
    router.push("/payment");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>구독 내역</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.table}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>무료 버전</Text>
            <Text style={styles.item}>일기 작성 기본 기능 이용</Text>
            <Text style={styles.item}>작성한 일기 저장/백업</Text>
            <Text style={styles.item}>멀티 디바이스 데이터 동기화</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>유료 버전 (월 3,300원)</Text>
            <Text style={styles.item}>일기 작성 기본 기능 이용</Text>
            <Text style={styles.item}>작성한 일기 저장/백업</Text>
            <Text style={styles.item}>멀티 디바이스 데이터 동기화</Text>
            <Text style={styles.item}>AI 일기 작성 기능 무제한 사용</Text>
            <Text style={styles.item}>AI 베스트샷 기능 무제한 사용</Text>
            <Text style={styles.item}>AI 일기 수정 기능 일기 당 3회 사용</Text>
            <Text style={styles.item}>다양한 감정 이모티콘 지원</Text>
            <Text style={styles.item}>우선 고객 지원</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleUpgradePress}>
        <Text style={styles.buttonText}>지금 구매하기 (월 3,300원)</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={paymentModalVisible}
        title="유료 버전으로 업그레이드"
        message="월 3,300원을 결제하시겠습니까?"
        cancelText="취소"
        confirmText="결제하기"
        onCancel={() => setPaymentModalVisible(false)}
        onConfirm={handleConfirmPayment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 26,
  },
  backButton: {
    position: "absolute",
    top: 80,
    left: 30,
    padding: 8,
    zIndex: 1,
  },
  backicon: {
    width: 12,
    height: 22,
  },
  header: {
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#A78C7B",
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  table: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  column: {
    width: "47%",
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#AC8B78",
    borderBottomWidth: 2,
    borderBottomColor: "#A78C7B",
    paddingBottom: 8,
    marginBottom: 12,
  },
  item: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    marginHorizontal: 30,
    marginBottom: 60,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(214, 128, 137, 0.7)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
