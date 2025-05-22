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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parseISO } from "date-fns";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import { usePhoto } from "../contexts/PhotoContext";
import { useDiary } from "../contexts/DiaryContext";
import HeaderDateAndTrash from "../components/Header/HeaderDateAndTrash";
import characterList from "../assets/characterList";
import IconButton from "../components/IconButton";

const screenWidth = Dimensions.get("window").width;

export default function EditWithAIPage() {
  const nav = useRouter();
  const { token } = useAuth();
  const { setMainPhotoId } = usePhoto();
  const { date: dateParam } = useLocalSearchParams();
  const date = dateParam;
  const parsedDate = parseISO(date);
  const { resetDiary } = useDiary();

  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestText, setRequestText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [markedText, setMarkedText] = useState("");
  const flatListRef = useRef(null);
  const webviewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchDiary = async () => {
    try {
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/by-date?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const text = await res.text();
      if (!res.ok || !text) return setDiary(undefined);
      const data = JSON.parse(text);
      setDiary(data);
      const found = data.photos.find(
        (p) => p.photoUrl === data.representativePhotoUrl
      );
      if (found) setMainPhotoId(String(found.id));
    } catch (err) {
      console.error("📛 다이어리 로딩 실패", err);
      setDiary(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (event) => {
    const { action, text, content } = JSON.parse(event.nativeEvent.data);
    if (action === "SELECTED") setSelectedText(text);
    if (action === "FINAL_TEXT") setMarkedText(content);
  };

  const handleSubmit = () => {
    webviewRef.current.injectJavaScript(`
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: "FINAL_TEXT",
        content: window.getMarkedText()
      }));
      true;
    `);

    setTimeout(() => {
      resetDiary();
      nav.replace({
        pathname: "/edit",
        params: { id: diary.id },
      });
    }, 500);
  };

  const onWebViewLoadEnd = () => {
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
    if (date && token) fetchDiary();
  }, [date, token]);

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 16, color: "#888" }}>로딩 중...</Text>
      </View>
    );

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
          <HeaderDateAndTrash
            date={parsedDate}
            onBack={() => {
              resetDiary();
              nav.replace({
                pathname: "/edit",
                params: { id: diary.id },
              });
            }}
            onTrashPress={() => {}}
          />

          <FlatList
            ref={flatListRef}
            data={photosToShow}
            keyExtractor={(item, index) =>
              item.id?.toString() ?? index.toString()
            }
            horizontal
            contentContainerStyle={{ paddingBottom: 0 }}
            style={{ marginBottom: 0 }}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index);
              }
            }}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            renderItem={({ item }) => (
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
            )}
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
            <WebView
              ref={webviewRef}
              originWhitelist={["*"]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              source={require("../assets/html/editor.html")}
              onLoadEnd={onWebViewLoadEnd}
              onMessage={handleMessage}
              style={styles.webview}
            />
          </View>
        </ScrollView>

        <View style={styles.inputAreaFixed}>
          <TextInput
            placeholder="이 일기의 어떤 점을 바꾸고 싶은지 입력하세요."
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
  image: {
    width: Dimensions.get("window").width - 60,
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
    height: 360,
    marginHorizontal: 30,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 0,
    marginBottom: 20,
  },
  textBoxWrapper: {
    backgroundColor: "#FCF9F4",
  },
  inputArea: {
    paddingHorizontal: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  inputBox: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#D68089",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
