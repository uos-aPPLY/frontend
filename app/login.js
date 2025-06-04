// app/login.js
import React, { useState, useEffect } from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import NaverLogin from "@react-native-seoul/naver-login";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const {
  BACKEND_URL,
  NAVER_CLIENT_KEY,
  NAVER_CLIENT_SECRET,
  NAVER_APP_NAME,
  NAVER_SERVICE_URL_SCHEME
} = Constants.expoConfig.extra;

export default function Login() {
  const router = useRouter();
  const { saveToken, checkRequiredAgreed } = useAuth();
  const [loading, setLoading] = useState(false);

  // Naver SDK 초기화
  useEffect(() => {
    (async () => {
      try {
        await NaverLogin.initialize({
          appName: NAVER_APP_NAME,
          consumerKey: NAVER_CLIENT_KEY,
          consumerSecret: NAVER_CLIENT_SECRET,
          serviceUrlSchemeIOS: NAVER_SERVICE_URL_SCHEME,
          disableNaverAppAuthIOS: true
        });
        console.log("Naver SDK initialized");
      } catch (e) {
        console.error("Naver 초기화 오류", e);
        Alert.alert("네이버 초기화 실패", e.message ?? "");
      }
    })();
  }, []);

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple 로그인", "iOS 기기에서만 지원됩니다.");
      return;
    }
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });

      const { identityToken, fullName } = credential;
      if (!identityToken) throw new Error("identityToken 누락");

      console.log("Apple identity token: ", identityToken);
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "apple",
          accessToken: identityToken
        })
      });
      if (!res.ok) throw new Error(await res.text());

      const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn } =
        await res.json();
      console.log("Backend access token: ", accessToken);
      console.log("Backend access token expires in: ", accessTokenExpiresIn);
      console.log("Backend refresh token: ", refreshToken);
      await saveToken({
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn
      });

      const requiredAgreed = await checkRequiredAgreed();
      router.replace(requiredAgreed ? "/home" : "/terms");
    } catch (e) {
      // console.error("Apple 로그인 오류:", e);
      // Alert.alert("Apple 로그인 실패", e.message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  // Naver Login Handler
  const handleNaverLogin = async () => {
    setLoading(true);
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
        body: JSON.stringify({ provider: "naver", accessToken: naverToken })
      });
      if (!res.ok) throw new Error(await res.text());

      const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn } =
        await res.json();
      console.log("Backend access token: ", accessToken);
      console.log("Backend access token expires in: ", accessTokenExpiresIn);
      console.log("Backend refresh token: ", refreshToken);
      await saveToken({
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn
      });

      const requiredAgreed = await checkRequiredAgreed();
      console.log("약관 동의 상태: ", requiredAgreed);
      router.replace(requiredAgreed ? "/home" : "/terms");
    } catch (e) {
      // console.error("네이버 로그인 처리 오류:", e);
      // Alert.alert("네이버 로그인 실패", e.message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  // Kakao Login Handler
  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      const token =
        Platform.OS === "ios" ? await KakaoLogin.loginWithKakaoAccount() : await KakaoLogin.login();
      console.log(token);
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "kakao",
          accessToken: token.accessToken
        })
      });
      if (!res.ok) throw new Error(await res.text());

      const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn } =
        await res.json();
      console.log("Backend access token: ", accessToken);
      console.log("Backend access token expires in: ", accessTokenExpiresIn);
      console.log("Backend refresh token: ", refreshToken);
      await saveToken({
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn
      });

      const requiredAgreed = await checkRequiredAgreed();
      router.replace(requiredAgreed ? "/home" : "/terms");
    } catch (e) {
      // console.error("Kakao login error", e);
      // Alert.alert("카카오 로그인 실패", e.message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D68089" />
        </View>
      )}
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
        {Platform.OS === "ios" && (
          <TouchableOpacity style={styles.appleLoginButton} onPress={handleAppleLogin}>
            <Image source={require("../assets/icons/appleicon.png")} style={styles.appleIcon} />
            <Text style={styles.naverLoginButtonText}>애플로 시작하기</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.kakaoLoginButton} onPress={handleKakaoLogin}>
          <Image source={require("../assets/icons/kakaoicon.png")} style={styles.kakaoIcon} />
          <Text style={styles.loginButtonText}>카카오로 시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.naverLoginButton} onPress={handleNaverLogin}>
          <Image source={require("../assets/icons/navericon.png")} style={styles.naverIcon} />
          <Text style={styles.naverLoginButtonText}>네이버로 시작하기</Text>
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
    alignItems: "center"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },
  logo: {
    width: 120,
    height: 120,
    marginVertical: -12
  },
  buttonContainer: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignItems: "center",
    gap: 10
  },
  appleLoginButton: {
    width: "80%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24
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
    paddingHorizontal: 24
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
    paddingHorizontal: 24
  },
  appleIcon: {
    width: 35,
    height: 35,
    marginRight: 5,
    marginBottom: 3
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 12
  },
  naverIcon: {
    width: 35,
    height: 35,
    marginRight: 5,
    marginBottom: 1
  },
  loginButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600"
  },
  naverLoginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
