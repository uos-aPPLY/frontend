// app/(tabs)/profile/settings/termofservice.js
import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../../components/Header/HeaderSettings";
import Constants from "expo-constants";
import RenderHtml from "react-native-render-html";

export default function TermsOfService() {
  const [termsContent, setTermsContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;
  const { width: windowWidth } = useWindowDimensions();

  const PADDING_HORIZONTAL = styles.content.paddingHorizontal || 30;
  const contentDisplayWidth = windowWidth - PADDING_HORIZONTAL * 2;

  useEffect(() => {
    const fetchTermsContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/terms/SERVICE_TERMS/content`, {
          method: "GET"
        });

        if (!response.ok) {
          let errorInfo = `서버 오류: ${response.status}`;
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const errorData = await response.json();
              errorInfo = errorData.message || JSON.stringify(errorData);
            } else {
              const errorText = await response.text();
              errorInfo = `${errorInfo} - ${errorText}`;
            }
          } catch (e) {
            console.warn("오류 응답 파싱 실패:", e);
          }
          throw new Error(errorInfo);
        }
        const htmlContent = await response.text();
        setTermsContent(htmlContent);
      } catch (error) {
        console.error("서비스 이용약관 로딩 실패:", error);
        setTermsContent(
          `<p style="color: red;">서비스 이용약관을 불러오는 데 실패했습니다.</p><p style="color: red;">오류: ${error.message}</p>`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsContent();
  }, [BACKEND_URL]);

  const tagsStyles = {
    p: {
      fontSize: styles.text.fontSize,
      lineHeight: styles.text.lineHeight,
      color: styles.text.color,
      marginBottom: 16
    },
    h1: {
      fontSize: 22,
      fontWeight: "bold",
      color: styles.text.color,
      marginTop: 10,
      marginBottom: 12
    },
    h2: {
      fontSize: (styles.text.fontSize || 14) * 1.5,
      fontWeight: "bold",
      color: styles.text.color,
      marginTop: 20,
      marginBottom: 10
    },
    h3: {
      fontSize: (styles.text.fontSize || 14) * 1.2,
      fontWeight: "bold",
      color: styles.text.color,
      marginTop: 16,
      marginBottom: 8
    },
    ul: {
      fontSize: styles.text.fontSize,
      lineHeight: styles.text.lineHeight,
      color: styles.text.color,
      marginLeft: 20,
      marginBottom: 16
    },
    ol: {
      fontSize: styles.text.fontSize,
      lineHeight: styles.text.lineHeight,
      color: styles.text.color,
      marginLeft: 20,
      marginBottom: 16
    },
    li: {
      fontSize: styles.text.fontSize,
      lineHeight: styles.text.lineHeight,
      color: styles.text.color,
      marginBottom: 8
    },
    strong: {
      fontWeight: "bold"
    },
    em: {
      fontStyle: "italic"
    },
    a: {
      color: "#007AFF",
      textDecorationLine: "underline"
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="서비스 이용약관" />

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A78C7B" />
          </View>
        ) : termsContent ? (
          <RenderHtml
            contentWidth={contentDisplayWidth}
            source={{ html: termsContent }}
            tagsStyles={tagsStyles}
            baseStyle={styles.text}
          />
        ) : (
          <Text style={styles.text}>표시할 내용이 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    flexGrow: 1
  },
  text: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200
  }
});
