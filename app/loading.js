import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoadingScreen() {
  const nav = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={nav.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ActivityIndicator size="large" color="#D68089" />
      <Text style={styles.text}>AI가 베스트샷을 추천 중이에요...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#a78c7b",
  },
  backButton: {
    position: "absolute",
    top: 70,
    left: 20,
    padding: 10,
  },
  backText: {
    fontSize: 24,
    color: "#a78c7b",
  },
});
