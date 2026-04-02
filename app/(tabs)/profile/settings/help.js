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
          uri: "https://abyssinian-mallow-80c.notion.site/DiaryPic-20edeb51139881a6bf8ede4311146dbc?source=copy_link"
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
