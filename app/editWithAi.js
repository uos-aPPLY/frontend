// ✅ 변경사항 반영: EditWithAIPage 전체
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
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
import { usePhoto } from "../contexts/PhotoContext";
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
  const {
    text,
    setText,
    diaryId,
    diaryMapById,
    selectedCharacter,
    setSelectedCharacter,
  } = useDiary();

  const diary = diaryMapById[diaryId];
  const [localText, setLocalText] = useState(text ?? "");
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatListRef = useRef(null);
  const webviewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [webViewHeight, setWebViewHeight] = useState(360);
  const characterObj = characterList.find((c) => c.name === diary.emotionIcon);
  const [localCharacter, setLocalCharacter] = useState(
    selectedCharacter ?? characterObj
  );
  const photosToShow = diary.photos || [];

  const handleMessage = async (event) => {
    try {
      const { action, content, height } = JSON.parse(event.nativeEvent.data);

      if (action === "HEIGHT" && height) setWebViewHeight(height);

      if (action === "FINAL_TEXT") {
        if (!diaryId || !content || !requestText) return;

        console.log("✅ PATCH body", {
          markedDiaryContent: content,
          userRequest: requestText,
        });

        setIsSubmitting(true);

        const response = await fetch(
          `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${diaryId}/ai-suggest-modification`,
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
        console.log("📨 수정 요청 응답 전문:\n", resultText);

        setIsSubmitting(false);

        if (!response.ok) {
          console.error("AI 수정 제안 실패:", resultText);
          return;
        }

        const parsed = JSON.parse(resultText);
        setLocalText(parsed.diary);

        setRequestText("");

        const newCharacter = characterList.find((c) => c.name === parsed.emoji);
        if (newCharacter) {
          setLocalCharacter(newCharacter);
        }

        // 수정된 내용 WebView에 반영
        const escapedContent = parsed.diary
          .replace(/\\/g, "\\\\")
          .replace(/`/g, "\\`")
          .replace(/\$/g, "\\$");

        webviewRef.current?.injectJavaScript(`
          window.postMessage(JSON.stringify({ content: \`${escapedContent}\` }), "*");
          true;
        `);
      }

      if (action === "SAVE_TEXT") {
        if (!content) return;
        setText(content);
        nav.replace({ pathname: "/edit", params: { id: diaryId } });
      }

      if (action === "ERROR") {
        alert(text || "AI 요청을 위한 하이라이팅이 필요해요.");
        return;
      }
    } catch (err) {
      console.warn("💥 WebView 메시지 처리 중 오류", err);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    webviewRef.current?.injectJavaScript(`
      (function() {
        const result = window.getMarkedText?.();
        if (!result || !result.includes('<edit token>')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            action: "ERROR",
            message: "하이라이트한 영역이 없습니다."
          }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            action: "FINAL_TEXT",
            content: result
          }));
        }
      })();
      true;
    `);
  };
  const handleSave = () => {
    setText(localText);
    if (localCharacter) setSelectedCharacter(localCharacter); // ✅ 추가
    nav.replace({ pathname: "/edit", params: { id: diaryId } });
  };

  const onWebViewLoadEnd = () => {
    setWebviewLoaded(true);
    if (!text) return;

    const escapedContent = text
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    webviewRef.current?.injectJavaScript(`
      window.postMessage(JSON.stringify({ content: \`${escapedContent}\` }), "*");
      true;
    `);
  };

  if (!diaryId || !diary) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ fontSize: 16, color: "#888" }}>
          일기 데이터를 불러오는 중입니다...
        </Text>
      </SafeAreaView>
    );
  }

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
              onBack={() =>
                nav.replace({ pathname: "/edit", params: { id: diaryId } })
              }
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
              <Image
                source={localCharacter?.source ?? characterObj?.source}
                style={styles.character}
              />
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
              editable={!isSubmitting}
            />

            {isSubmitting ? (
              <View style={styles.loadingSubmit}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>보내기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  scrollContainer: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },
  middle: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingHorizontal: 30,
    marginVertical: 10,
    flexDirection: "row",
  },
  character: { width: 42, height: 40 },
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
  loadingSubmit: {
    backgroundColor: "#E1A4A9",
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
