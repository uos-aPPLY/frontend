// app/(onboarding)/terms.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import CheckBox from "../../components/CheckBox";
import Constants from "expo-constants";

const HEADER_HEIGHT_REFERENCE = 50;
const BUTTON_PADDING = 8;
const ICON_HEIGHT = 22;
const ICON_WIDTH = 12;
const ICON_HORIZONTAL_POSITION_REFERENCE = 30;

const touchableAreaHeight = ICON_HEIGHT + BUTTON_PADDING * 2;
const topOffsetInHeader = (HEADER_HEIGHT_REFERENCE - touchableAreaHeight) / 2;
const absoluteTopPosition = Constants.statusBarHeight + topOffsetInHeader;

const absoluteLeftPosition =
  ICON_HORIZONTAL_POSITION_REFERENCE - BUTTON_PADDING;

export default function Terms() {
  const router = useRouter();
  const { fetchTerms, submitAgreements, signOut } = useAuth();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchTerms();
        setTerms(list);
      } catch (e) {
        // Alert.alert("약관 로드 오류", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id) =>
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, agreed: !t.agreed } : t))
    );

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const allRequiredAgreed = terms
    .filter((t) => t.required)
    .every((t) => t.agreed);
  const allChecked = terms.every((t) => t.agreed);

  const toggleAll = () =>
    setTerms((prev) => prev.map((t) => ({ ...t, agreed: !allChecked })));

  const onConfirm = async () => {
    try {
      const agreements = terms.map(({ id, agreed }) => ({
        termsId: id,
        agreed,
      }));
      await submitAgreements(agreements);
      router.replace("/nickname");
    } catch (e) {
      Alert.alert("제출 실패", e.message);
    }
  };

  if (loading) return null;

  const renderRow = (t) => {
    const isExpanded = expandedId === t.id;
    return (
      <View key={t.id} style={styles.rowContainer}>
        <View style={styles.itemRow}>
          <CheckBox value={t.agreed} onValueChange={() => toggle(t.id)} />
          <Text style={styles.itemText}>
            {t.required ? "[필수] " : "[선택] "}
            {t.title}
          </Text>
          <TouchableOpacity
            onPress={() => toggleExpand(t.id)}
            style={styles.arrowButton}
          >
            <Image
              source={require("../../assets/icons/forwardicon.png")}
              style={[styles.arrowIcon, isExpanded && styles.arrowUp]}
            />
          </TouchableOpacity>
        </View>
        {isExpanded && (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{t.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const goBack = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>
          <Image
            source={require("../../assets/icons/backicon.png")}
            style={styles.backicon}
            resizeMode="contain"
          />
        </Text>
      </TouchableOpacity>

      <Text style={styles.header}>서비스 이용 약관에{"\n"}동의해주세요.</Text>

      <View style={styles.item}>
        <CheckBox value={allChecked} onValueChange={toggleAll} size={30} />
        <Text style={styles.itemTextAll}>전체 동의</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView style={styles.textContainer}>
        {terms.map(renderRow)}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          allRequiredAgreed
            ? styles.confirmButtonEnabled
            : styles.confirmButtonDisabled,
        ]}
        onPress={onConfirm}
        disabled={!allRequiredAgreed}
      >
        <Text style={styles.confirmButtonText}>확인</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fcf9f4",
    flex: 1,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
  },
  backButton: {
    position: "absolute",
    top: absoluteTopPosition, // 수정된 top 값
    left: absoluteLeftPosition, // 수정된 left 값
    padding: BUTTON_PADDING, // 상수 값 사용
    zIndex: 1, // 다른 요소 위에 오도록 설정
  },
  backicon: {
    width: ICON_WIDTH, // 상수 값 사용
    height: ICON_HEIGHT, // 상수 값 사용
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "left",
    lineHeight: 36,
  },
  textContainer: { flex: 1 },
  item: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  itemText: { fontSize: 18, color: "#000000", paddingBottom: 2, marginLeft: 2 },
  itemTextAll: { fontSize: 20, color: "#000000", paddingBottom: 2 },
  separator: {
    height: 1,
    backgroundColor: "#C7C7CC",
    marginTop: 10,
    marginBottom: 28,
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    marginBottom: 60,
  },
  confirmButtonEnabled: {
    backgroundColor: "rgba(214, 128, 137, 0.7)",
  },
  confirmButtonDisabled: {
    backgroundColor: "#D9D9D9",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  rowContainer: { marginBottom: 20 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  arrowButton: { marginLeft: "auto", padding: 8 },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#A78C7B",
    resizeMode: "contain",
  },
  arrowUp: { transform: [{ rotate: "90deg" }] },
  contentContainer: {
    padding: 8,
    backgroundColor: "#FFF8F5",
    borderRadius: 8,
  },
  contentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
});
