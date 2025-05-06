// app/terms.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  Image,
  Text,
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
// import { useAuth } from "../contexts/AuthContext";

export default function Terms() {
  const router = useRouter();
  //   const { agreeToTerms } = useAuth();

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

  const goBack = () => {
    router.back();
  };

  const onConfirm = () => {
    // 백엔드 미구현: 바로 홈으로 이동
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>
          <Image
            source={require("../assets/icons/backicon.png")}
            style={styles.backicon}
            resizeMode="contain"
          />
        </Text>
      </TouchableOpacity>

      <Text style={styles.header}>서비스 이용 약관에 동의해주세요.</Text>
      <View style={styles.item}>
        <Checkbox value={allAgreed} onValueChange={setAllAgreed} />
        <Text style={styles.itemText}>전체 동의</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView style={styles.textContainer}>
        <View style={styles.item}>
          <Checkbox value={ageChecked} onValueChange={setAgeChecked} />
          <Text style={styles.itemText}>[필수] 만 14세 이상입니다.</Text>
        </View>
        <View style={styles.item}>
          <Checkbox value={termsChecked} onValueChange={setTermsChecked} />
          <Text style={styles.itemText}>[필수] 서비스 이용약관</Text>
        </View>
        <View style={styles.item}>
          <Checkbox value={privacyChecked} onValueChange={setPrivacyChecked} />
          <Text style={styles.itemText}>[필수] 개인정보 처리방침</Text>
        </View>
        <View style={styles.item}>
          <Checkbox
            value={marketingChecked}
            onValueChange={setMarketingChecked}
          />
          <Text style={styles.itemText}>[선택] 마케팅 정보 수신 동의</Text>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          title="약관에 동의합니다"
          onPress={onConfirm}
          disabled={!allRequiredAgreed}
        />
      </View>
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
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 40,
    textAlign: "center",
    width: "65 %",
  },
  textContainer: { flex: 1 },
  item: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  itemText: { marginLeft: 10, fontSize: 16, color: "#333" },
  buttonContainer: { marginBottom: 40 },
  separator: {
    height: 1,
    backgroundColor: "#C7C7CC",
    marginVertical: 12,
    marginBottom: 28,
  },
});
