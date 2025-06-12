import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");

const MaintenanceScreen = ({
  isUnderMaintenance,
  isServerDown,
  maintenanceMessage,
  onRetry,
  isRetrying = false
}) => {
  // 디버깅용 로그
  console.log("MaintenanceScreen props:", {
    isUnderMaintenance,
    isServerDown,
    maintenanceMessage,
    isRetrying
  });

  // MaintenanceScreen이 표시될 때 Splash Screen 숨기기
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log("Splash screen hidden from MaintenanceScreen");
      } catch (error) {
        console.warn("Failed to hide splash screen:", error);
      }
    };
    hideSplash();
  }, []);
  const renderMaintenanceMode = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D68089" />
      <LinearGradient colors={["#D68089", "#F5A6B4"]} style={styles.gradient}>
        <View style={styles.content}>
          {/* 점검 아이콘 */}
          <View style={styles.iconContainer}>
            <Ionicons name="construct" size={80} color="#FFFFFF" />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>서비스 점검 중</Text>

          {/* 메시지 */}
          <Text style={styles.message}>
            {maintenanceMessage || "더 나은 서비스 제공을 위해\n잠시 점검 중입니다."}
          </Text>

          {/* 점검 안내 */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              점검이 완료되면 정상적으로{"\n"}
              서비스를 이용하실 수 있습니다.
            </Text>
          </View>

          {/* 재시도 버튼 */}
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} disabled={isRetrying}>
            <Text style={styles.retryButtonText}>
              {isRetrying ? "확인 중..." : "다시 확인하기"}
            </Text>
          </TouchableOpacity>

          {/* 개발자 힌트 */}
          {__DEV__ && (
            <View style={styles.devHintContainer}>
              <Text style={styles.devHintText}>개발자 메뉴: 우측 상단 🐛 버튼</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderServerDownMode = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.gradient}>
        <View style={styles.content}>
          {/* 에러 아이콘 */}
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline" size={80} color="#FFFFFF" />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>연결 실패</Text>

          {/* 메시지 */}
          <Text style={styles.message}>
            서버에 연결할 수 없습니다.{"\n"}
            네트워크 연결을 확인해주세요.
          </Text>

          {/* 안내 */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • Wi-Fi 또는 모바일 데이터 연결 확인{"\n"}• 잠시 후 다시 시도해주세요{"\n"}• 문제가
              지속되면 고객센터에 문의해주세요
            </Text>
          </View>

          {/* 재시도 버튼 */}
          <TouchableOpacity
            style={[styles.retryButton, styles.retryButtonError]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            <Ionicons
              name={isRetrying ? "sync" : "refresh"}
              size={20}
              color="#FFFFFF"
              style={[styles.retryIcon, isRetrying && styles.spinning]}
            />
            <Text style={styles.retryButtonText}>
              {isRetrying ? "연결 시도 중..." : "다시 시도"}
            </Text>
          </TouchableOpacity>

          {/* 개발자 힌트 */}
          {__DEV__ && (
            <View style={styles.devHintContainer}>
              <Text style={styles.devHintText}>개발자 메뉴: 우측 상단 🐛 버튼</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  if (isUnderMaintenance) {
    console.log("Rendering maintenance mode");
    return renderMaintenanceMode();
  } else if (isServerDown) {
    console.log("Rendering server down mode");
    return renderServerDownMode();
  }

  console.log("Rendering nothing - no maintenance or server down");
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gradient: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30
  },
  iconContainer: {
    marginBottom: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20
  },
  message: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 30,
    opacity: 0.9
  },
  infoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 40,
    width: "100%"
  },
  infoText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9
  },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200
  },
  retryButtonError: {
    backgroundColor: "rgba(255, 255, 255, 0.25)"
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center"
  },
  retryIcon: {
    marginRight: 8
  },
  spinning: {
    // 회전 애니메이션은 추후 Animated API로 구현 가능
  },
  devHintContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20
  },
  devHintText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden"
  }
});

export default MaintenanceScreen;
