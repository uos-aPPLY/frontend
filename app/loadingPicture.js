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

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => nav.push("/create")}
        />
      </View> */}

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
    backgroundColor: "#FCF9F4",
  },
  header: {
    paddingTop: 75,
    paddingLeft: 30,
  },
  loadingArea: {
    flex: 1,
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
