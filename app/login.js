// app/login.js
import React, { useEffect } from "react";
import {
  SafeAreaView,
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import NaverLogin from "@react-native-seoul/naver-login";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const {
  BACKEND_URL,
  NAVER_CLIENT_KEY,
  NAVER_CLIENT_SECRET,
  NAVER_APP_NAME,
  NAVER_SERVICE_URL_SCHEME,
} = Constants.expoConfig.extra;

export default function Login() {
  const router = useRouter();
  const { saveToken, checkRequiredAgreed } = useAuth();

  const kakaoRedirectUri = Linking.createURL("oauth", { scheme: "diarypic" });

  // Naver SDK 초기화
  useEffect(() => {
    (async () => {
      try {
        await NaverLogin.initialize({
          appName: NAVER_APP_NAME,
          consumerKey: NAVER_CLIENT_KEY,
          consumerSecret: NAVER_CLIENT_SECRET,
          serviceUrlSchemeIOS: NAVER_SERVICE_URL_SCHEME,
          disableNaverAppAuthIOS: true,
        });
        console.log("Naver SDK initialized");
      } catch (e) {
        console.error("Naver 초기화 오류", e);
        Alert.alert("네이버 초기화 실패", e.message ?? "");
      }
    })();
  }, []);

  // Naver Login Handler
  const handleNaverLogin = async () => {
    try {
      const { successResponse, failureResponse } = await NaverLogin.login();
      console.log("Naver Token: ", successResponse);
      if (failureResponse) {
        if (!failureResponse.isCancel) {
          Alert.alert("네이버 로그인 오류", failureResponse.message);
        }
        return;
      }

      const { accessToken: naverToken } = successResponse;
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "naver", accessToken: naverToken }),
      });
      if (!res.ok) throw new Error(await res.text());

      const {
        accessToken: backendAccessToken,
        refreshToken: backendRefreshToken,
      } = await res.json();
      console.log("Backend access token: ", backendAccessToken);
      console.log("Backend refresh token: ", backendRefreshToken);

      await saveToken({
        accessToken: backendAccessToken,
        refreshToken: backendRefreshToken,
      });

      const requiredAgreed = await checkRequiredAgreed();
      console.log("약관 동의 상태: ", requiredAgreed);
      router.replace(requiredAgreed ? "/home" : "/terms");
    } catch (e) {
      console.error("네이버 로그인 처리 오류:", e);
      Alert.alert("네이버 로그인 실패", e.message ?? "알 수 없는 오류");
    }
  };

  // Kakao Login Handler
  const handleKakaoLogin = async () => {
    try {
      // iOS 시뮬레이터는 KakaoTalk 앱이 없으므로 계정 로그인으로 바로 진입
      const token =
        Platform.OS === "ios"
          ? await KakaoLogin.loginWithKakaoAccount()
          : await KakaoLogin.login(); // 안드로이드는 그대로 사용
      console.log(token);
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "kakao",
          accessToken: token.accessToken,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const { accessToken, refreshToken } = await res.json();
      await saveToken({ accessToken, refreshToken });

      const requiredAgreed = await checkRequiredAgreed();
      router.replace(requiredAgreed ? "/home" : "/terms");
    } catch (e) {
      console.error("Kakao login error", e);
      Alert.alert("카카오 로그인 실패", e.message ?? "알 수 없는 오류");
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
        source={require("../assets/icons/brownicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.kakaoLoginButton}
          onPress={handleKakaoLogin}
        >
          <Image
            source={require("../assets/icons/kakaoicon.png")}
            style={styles.kakaoIcon}
          />
          <Text style={styles.loginButtonText}>카카오로 시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.naverLoginButton}
          onPress={handleNaverLogin}
        >
          <Image
            source={require("../assets/icons/navericon.png")}
            style={styles.naverIcon}
          />
          <Text style={styles.naverloginButtonText}>네이버로 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles (기존과 동일)
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
    gap: 10,
  },
  kakaoLoginButton: {
    width: "80%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  naverLoginButton: {
    width: "80%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#03C75A",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  naverIcon: {
    width: 35,
    height: 35,
    marginRight: 5,
  },
  loginButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  naverloginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
