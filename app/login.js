// app/login.js
import React from "react";
import {
  SafeAreaView,
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function Login() {
  const router = useRouter();
  const { saveToken } = useAuth();

  const KAKAO_SCHEME = "diarypic.app";
  const redirectUri = Linking.createURL("oauth", { scheme: KAKAO_SCHEME });

  const login = async () => {
    try {
      // 카카오 SDK 로그인
      const kakaoResult = await KakaoLogin.login({ redirectUri });
      console.log("Login Success", kakaoResult);

      // 백엔드 POST /api/auth/login
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${kakaoResult.accessToken}`,
        },
        body: JSON.stringify({
          provider: "kakao",
          accessToken: kakaoResult.accessToken,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend login failed: ${errText}`);
      }

      const {
        accessToken: backendAccessToken,
        accessTokenExpiresIn,
        userInfo,
      } = await res.json();

      console.log("Backend login response:", {
        backendAccessToken,
        accessTokenExpiresIn,
        userInfo,
      });

      await saveToken(backendAccessToken);

      if (!userInfo.hasAgreedToTerms) {
        router.replace("/terms");
      } else {
        router.replace("/home");
      }
    } catch (error) {
      console.log("Login Fail:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../assets/bangulicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Image
        source={require("../assets/brownicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Image
            source={require("../assets/icons/kakaoicon.png")}
            style={styles.kakaoIcon}
            resizeMode="contain"
          />
          <Text style={styles.loginButtonText}>카카오로 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f4",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginVertical: -10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    width: 315,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
