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
} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function Terms() {
  const router = useRouter();
  const { fetchTerms, submitAgreements, signOut } = useAuth();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchTerms();
        setTerms(list);
      } catch (e) {
        Alert.alert("약관 로드 오류", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id) =>
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, agreed: !t.agreed } : t))
    );

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

  const renderRow = (t) => (
    <View key={t.id} style={styles.item}>
      <Checkbox
        value={t.agreed}
        onValueChange={() => toggle(t.id)}
        style={styles.checkbox}
        color={t.agreed ? "rgba(214, 128, 137, 0.7)" : "#D9D9D9"}
      />
      <Text style={styles.itemText}>
        {t.required ? "[필수] " : "[선택] "}
        {t.title}
      </Text>
    </View>
  );

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
        <Checkbox
          value={allChecked}
          onValueChange={toggleAll}
          style={styles.checkbox}
          color={allChecked ? "rgba(214, 128, 137, 0.7)" : "#D9D9D9"}
        />
        <Text style={styles.itemText}>전체 동의</Text>
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
    paddingTop: 50,
    paddingLeft: 30,
    paddingRight: 30,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 30,
    padding: 8,
  },
  backicon: {
    width: 12,
    height: 22,
  },
  backText: {
    fontSize: 16,
    color: "#333",
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
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 18,
  },
  itemText: { fontSize: 18, color: "#333", paddingBottom: 2 },
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
});
