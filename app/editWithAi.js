import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parseISO } from "date-fns";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import { useDiary } from "../contexts/DiaryContext";
import HeaderDate from "../components/Header/HeaderDate";
import characterList from "../assets/characterList";
import IconButton from "../components/IconButton";
import ImageSlider from "../components/ImageSlider";

const screenWidth = Dimensions.get("window").width;

export default function EditWithAIPage() {
  const nav = useRouter();
  const { token } = useAuth();
  const { date: dateParam } = useLocalSearchParams();
  const date = dateParam;
  const parsedDate = parseISO(date);
  const { setText, resetDiary, diaryId, diaryMapById } = useDiary();
  const diary = diaryMapById[diaryId];

  const [loading, setLoading] = useState(true);
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [markedText, setMarkedText] = useState("");
  const flatListRef = useRef(null);
  const webviewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(360);

  const handleMessage = async (event) => {
    try {
      const { action, text, content, height } = JSON.parse(
        event.nativeEvent.data
      );

      if (action === "HEIGHT" && height) setWebViewHeight(height);

      if (action === "FINAL_TEXT") {
        if (!diaryId || !content || !requestText) {
          console.warn("❌ 필수 데이터 누락", {
            diaryId,
            content,
            requestText,
          });
          return;
        }

        console.log("📦 요청 보낼 내용:", {
          diaryId,
          markedDiaryContent: content,
          userRequest: requestText,
        });

        const response = await fetch(
          `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${diaryId}/ai-modify`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              markedDiaryContent: content,
              userRequest: requestText,
            }),
          }
        );

        const resultText = await response.text();
        console.log("🟢 AI Modify 응답:", resultText);

        if (!response.ok) {
          console.error(
            "❌ AI 수정 요청 실패:",
            resultText,
            `상태코드: ${response.status}`
          );
          return;
        }

        resetDiary();
        nav.replace({
          pathname: "/edit",
          params: { id: diaryId },
        });
      }

      if (action === "SAVE_TEXT") {
        if (!content) {
          console.warn("⛔ 저장할 텍스트 없음");
          return;
        }
        setText(content); // 📥 DiaryContext 전역 저장
        console.log("✅ WebView 내용 저장 완료:", content);

        nav.replace({
          pathname: "/edit",
          params: { id: diaryId },
        });
      }
    } catch (err) {
      console.warn("💥 웹뷰 메시지 파싱 실패", err);
    }
  };

  const handleSubmit = () => {
    webviewRef.current?.injectJavaScript(`
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: "FINAL_TEXT",
        content: window.getMarkedText()
      }));
      true;
    `);
  };

  const handleSave = () => {
    webviewRef.current?.injectJavaScript(`
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: "SAVE_TEXT",
      content: window.getPlainText()
    }));
    true;
  `);
  };

  const onWebViewLoadEnd = () => {
    setWebviewLoaded(true);
    if (!diary) return;

    const escapedContent = diary.content
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    const jsCode = `
      (function() {
        window.postMessage(JSON.stringify({ content: \`${escapedContent}\` }), "*");
      })();
      true;
    `;
    webviewRef.current.injectJavaScript(jsCode);
  };

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  if (!diaryId || !diary) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingHeader}>
          <IconButton
            source={require("../assets/icons/backicon.png")}
            wsize={24}
            hsize={24}
            onPress={() => nav.back()}
          />
        </View>

        <ActivityIndicator size="large" color="#D68089" />
        <Text style={{ fontSize: 16, color: "#888", marginTop: 10 }}>
          일기를 불러오는 중입니다...
        </Text>
      </SafeAreaView>
    );
  }

  if (!diary)
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 16, color: "#888" }}>
          일기 데이터를 불러올 수 없습니다.
        </Text>
      </View>
    );

  const photosToShow = diary.photos || [];
  const characterObj = characterList.find((c) => c.name === diary.emotionIcon);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <HeaderDate
              date={parsedDate}
              hasText={true}
              onBack={() => {
                nav.replace({
                  pathname: "/edit",
                  params: { id: diaryId },
                });
              }}
              onSave={handleSave}
            />

            <ImageSlider
              photos={photosToShow}
              isGridView={false}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              flatListRef={flatListRef}
            />

            <View style={styles.middle}>
              <View style={{ width: 29 }} />
              <Image source={characterObj?.source} style={styles.character} />
              <IconButton
                source={require("../assets/icons/highlighticon.png")}
                wsize={24}
                hsize={24}
                style={{ marginRight: 5 }}
                onPress={() => {
                  webviewRef.current?.injectJavaScript(`
                    if (typeof toggleMark === 'function') toggleMark();
                    true;
                  `);
                }}
              />
            </View>

            <View style={styles.textBoxWrapper}>
              {!webviewLoaded && (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="small" color="#D68089" />
                  <Text style={{ marginTop: 10, color: "#A78C7B" }}>
                    로딩 중...
                  </Text>
                </View>
              )}

              <WebView
                ref={webviewRef}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                source={require("../assets/html/editor.html")}
                onLoadEnd={onWebViewLoadEnd}
                onMessage={handleMessage}
                style={[
                  styles.webview,
                  { height: webViewHeight },
                  !webviewLoaded && { height: 0 },
                ]}
              />
            </View>
          </ScrollView>

          <View style={styles.inputAreaFixed}>
            <TextInput
              placeholder="수정할 부분을 하이라이팅한 뒤, 원하는 수정 방향을 입력해주세요."
              placeholderTextColor="#aaa"
              multiline
              style={styles.inputBox}
              value={requestText}
              onChangeText={setRequestText}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  scrollContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },

  loadingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingLeft: 30,
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: 30,
  },
  middle: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingHorizontal: 30,
    marginVertical: 10,
    flexDirection: "row",
  },
  character: {
    width: 42,
    height: 40,
  },
  webview: {
    marginHorizontal: 30,
    borderRadius: 20,
    overflow: "hidden",
  },
  webviewLoading: {
    height: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  textBoxWrapper: {
    backgroundColor: "#FCF9F4",
  },
  inputAreaFixed: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
  },
  inputBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#E1A4A9",
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
