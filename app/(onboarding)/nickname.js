// app/(onboarding)/nickname.js
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const { BACKEND_URL } = Constants.expoConfig.extra;

const Nickname = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    router.replace("/terms");
  };

  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) throw new Error("토큰이 없습니다.");

      const res = await fetch(`${BACKEND_URL}/api/users/nickname`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`닉네임 업데이트 실패: ${errText}`);
      }

      router.replace("/speechstyle");
    } catch (error) {
      console.error(error);
      Alert.alert("오류", error.message || "닉네임 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = nickname.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <Text style={styles.title}>
          DiaryPic에서 사용할{"\n"}닉네임을 작성해주세요.
        </Text>

        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          maxLength={10}
        />
        <Text style={styles.helper}>최대 10자까지 작성 가능해요.</Text>
      </KeyboardAvoidingView>
      <TouchableOpacity
        style={[
          styles.confirmButton,
          isValid ? styles.confirmButtonEnabled : styles.confirmButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!isValid}
      >
        <Text style={styles.confirmButtonText}>
          {loading ? "저장 중..." : "확인"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f4",
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  keyboardContainer: {
    flex: 1,
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 36,
  },
  input: {
    borderColor: "#C7C7CC",
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#fcf9f4",
    fontSize: 16,
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "black",
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

export default Nickname;
