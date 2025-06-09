//app/loading/loadingPicture.js
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

export default function LoadingPage() {
  const nav = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    // ✅ iOS 슬라이딩 뒤로가기 막기
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.message}>사진을 업로드 중이에요...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: "#A78C7B",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22
  }
});
