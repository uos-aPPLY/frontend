// app/settings/export.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ExportPage() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
        />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>내보내기</Text>
      </View>
      <View style={styles.content}>
        <Text>내보내기 화면입니다.</Text>
      </View>
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
  header: { paddingHorizontal: 20, marginBottom: 20, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: "#A78C7B" },
  content: { flex: 1, paddingHorizontal: 30 },
});
