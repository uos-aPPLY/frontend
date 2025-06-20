// app/(tabs)/profile/settings/help.js
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Header from "../../../../components/Header/HeaderSettings";

export default function HelpPage() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="문의하기" />

      <WebView
        style={styles.webview}
        source={{
          uri: "https://tough-trick-2e0.notion.site/1f22150012138047ab7fd687aa02031e?pvs=4"
        }}
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  webview: {
    flex: 1
  }
});
