// app/login.js
import React, { useEffect } from "react";
import {
  SafeAreaView,
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const {
  BACKEND_URL,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} = Constants.expoConfig.extra;

export default function Login() {
  const router = useRouter();
  const { saveToken } = useAuth();

  // Kakao Redirect URI
  const kakaoRedirectUri = Linking.createURL("oauth", { scheme: "diarypic" });

  console.log(GOOGLE_IOS_CLIENT_ID);
  console.log(GOOGLE_WEB_CLIENT_ID);
  // Configure Google Signin
  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: ["openid", "profile", "email"],
    });
  }, []);

  // Google Login Handler
  // ------------------- Google 로그인 -------------------
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      /* 1) 기존 세션 초기화 */
      await GoogleSignin.signOut().catch(() => {});

      /* 2) 로그인 */
      const signInRes = await GoogleSignin.signIn(); // user info
      const tokenRes = await GoogleSignin.getTokens(); // { idToken, accessToken }

      // signInRes.user.idToken (iOS) vs tokenRes.idToken (Android) 보완
      const idToken = tokenRes.idToken || signInRes.idToken;
      const accessToken = tokenRes.accessToken;

      if (!idToken) {
        console.log("signInRes →", signInRes); // 최종 디버깅용
        throw new Error("Google idToken이 없습니다.");
      }

      console.log("Google tokens →", { idToken, accessToken });

      /* 3) 백엔드 전송 */
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken }),
      });

      if (!res.ok) {
        console.error("Backend login failed", await res.text());
        return;
      }

      const { accessToken: backendAccessToken } = await res.json();
      await saveToken(backendAccessToken);
      router.replace("/terms");
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("사용자가 Google 로그인을 취소했습니다.");
      } else {
        console.error("Google 로그인 오류", error);
      }
    }
  };

  // Kakao Login Handler
  const handleKakaoLogin = async () => {
    try {
      const kakaoResult = await KakaoLogin.login({
        redirectUri: kakaoRedirectUri,
      });
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "kakao",
          accessToken: kakaoResult.accessToken,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend login failed: ${errText}`);
      }
      const { accessToken: backendAccessToken } = await res.json();
      console.log("Backend login response:", {
        backendAccessToken,
      });

      const profile = await saveToken(backendAccessToken);
      // if (!profile?.hasAgreedToTerms) {
      //   router.replace("/terms");
      // } else {
      //   router.replace("/home");
      // }
      await saveToken(backendAccessToken);
      router.replace("/terms");
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
          style={styles.googleLoginButton}
          onPress={handleGoogleLogin}
        >
          <Image
            source={require("../assets/icons/googleicon.png")}
            style={styles.kakaoIcon}
          />
          <Text style={styles.loginButtonText}>구글로 시작하기</Text>
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
  googleLoginButton: {
    width: "80%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderColor: "#d3d3d3",
    borderWidth: 1,
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
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
