// app/loading.js 또는 app/loadingPicture.js

import { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import IconButton from "../components/IconButton";

export default function LoadingPage() {
  const nav = useRouter();

  // 필요 시 자동 이동 로직도 가능 (원하면 추가해줄게)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => nav.push("/create")} // 또는 calendar 등 원하는 경로
        />
      </View>

      {/* 본문: 로딩 인디케이터 + 메시지 */}
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.message}>사진을 업로드 중이에요...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingLeft: 10,
    zIndex: 1,
  },
  loadingArea: {
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: "#A78C7B",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
});
