// app/settings/termofservice.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Header from "../../../../components/Header/HeaderSettings";

export default function TermsOfService() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="서비스 이용약관" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          제1조(목적) 이 약관은 …{"\n\n"}
          제2조(정의) …{"\n\n"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  content: { paddingHorizontal: 30, paddingBottom: 40 },
  text: { fontSize: 14, color: "#333", lineHeight: 22 }
});
