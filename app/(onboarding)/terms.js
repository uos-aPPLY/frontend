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
  const { signOut } = useAuth();

  const [allAgreed, setAllAgreed] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  const allRequiredAgreed = ageChecked && termsChecked && privacyChecked;

  useEffect(() => {
    if (allAgreed) {
      setAgeChecked(true);
      setTermsChecked(true);
      setPrivacyChecked(true);
      setMarketingChecked(true);
    } else {
      setAgeChecked(false);
      setTermsChecked(false);
      setPrivacyChecked(false);
      setMarketingChecked(false);
    }
  }, [allAgreed]);

  useEffect(() => {
    if (ageChecked && termsChecked && privacyChecked && marketingChecked) {
      setAllAgreed(true);
    } else if (allAgreed) {
      setAllAgreed(false);
    }
  }, [ageChecked, termsChecked, privacyChecked, marketingChecked]);

  const goBack = async () => {
    await signOut();
    router.replace("/login");
  };

  const onConfirm = () => {
    // 백엔드 미구현
    router.replace("/nickname");
  };

  const renderCheckbox = (checked, setChecked) => (
    <Checkbox
      value={checked}
      onValueChange={() => setChecked((prev) => !prev)}
      style={styles.checkbox}
      color={checked ? "#D68089" : "#D9D9D9"}
    />
  );

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
        {renderCheckbox(allAgreed, setAllAgreed)}
        <Text style={styles.itemText}>전체 동의</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView style={styles.textContainer}>
        <View style={styles.item}>
          {renderCheckbox(ageChecked, setAgeChecked)}
          <Text style={styles.itemText}>[필수] 만 14세 이상입니다.</Text>
        </View>
        <View style={styles.item}>
          {renderCheckbox(termsChecked, setTermsChecked)}
          <Text style={styles.itemText}>[필수] 서비스 이용약관</Text>
        </View>
        <View style={styles.item}>
          {renderCheckbox(privacyChecked, setPrivacyChecked)}
          <Text style={styles.itemText}>[필수] 개인정보 처리방침</Text>
        </View>
        <View style={styles.item}>
          {renderCheckbox(marketingChecked, setMarketingChecked)}
          <Text style={styles.itemText}>[선택] 마케팅 정보 수신 동의</Text>
        </View>
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
    backgroundColor: "#D68089",
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
