// app/settings/termofservice.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function TermsOfService() {
  const router = useRouter();
  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 실제 약관 텍스트를 여기에 넣으세요 */}
        <Text style={styles.text}>
          {/* 서비스 이용약관 콘텐츠 예시 */}
          제1조(목적) 이 약관은 …{"\n\n"}
          제2조(정의) …{"\n\n"}
          {/* 이하 생략 */}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4", paddingTop: 26 },
  backButton: {
    position: "absolute",
    top: 80,
    left: 30,
    padding: 8,
    zIndex: 1,
  },
  backicon: { width: 12, height: 22 },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#A78C7B",
  },
  content: { paddingHorizontal: 30, paddingBottom: 40 },
  text: { fontSize: 14, color: "#333", lineHeight: 22 },
});
