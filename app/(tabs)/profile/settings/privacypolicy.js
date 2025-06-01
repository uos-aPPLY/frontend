// app/(tabs)/profile/settings/privacypolicy.js
import { Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../../components/Header/HeaderSettings";

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={["top"]}>
      <Header title="개인정보 처리방침" />

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.text}>
          제1조(개인정보의 처리 목적) …{"\n\n"}
          제2조(수집하는 개인정보 항목) …{"\n\n"}
          {/* 이하 생략 */}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  scrollContent: {
    paddingHorizontal: 30
  },
  text: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22
  }
});
