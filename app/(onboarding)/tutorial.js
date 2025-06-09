// app/(onboarding)/tutorial.js
import React, { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");
const pages = [
  {
    image: require("../../assets/icons/cameraicon.png"),
    title: "사진만 올리면 하루 일기가\n자동으로 완성돼요",
    subtitle: "사진별 포커스 키워드로\n더 풍부한 일기를 만들 수 있어요"
  },
  {
    image: require("../../assets/icons/conversationicon.png"),

    title: "말투 커스터마이징으로\n나에게 맞는 일기를 만들 수 있어요",
    subtitle: "마이페이지 설정에서\n언제든 말투를 바꿀 수 있어요"
  },
  {
    image: require("../../assets/icons/handpictureicon.png"),

    title: "사진 여러 장을 업로드하면\nAI가 좋은 사진을 골라줘요",
    subtitle: "필수 사진을 선택해\n일기를 생성할 수 있어요"
  },
  {
    image: require("../../assets/icons/phoneicon.png"),

    title: "텍스트 명령만으로 AI 일기를\n손쉽게 수정할 수 있어요",
    subtitle: "모든 일기는 캘린더로 한눈에 정리돼요"
  }
];

const HEADER_HEIGHT_REFERENCE = 50;
const BUTTON_PADDING = 8;
const ICON_HEIGHT = 22;
const ICON_HORIZONTAL_POSITION_REFERENCE = 30;

const touchableAreaHeight = ICON_HEIGHT + BUTTON_PADDING * 2;
const topOffsetInHeader = (HEADER_HEIGHT_REFERENCE - touchableAreaHeight) / 2;
const absoluteTopPosition = Constants.statusBarHeight + topOffsetInHeader;

const absoluteLeftPosition = ICON_HORIZONTAL_POSITION_REFERENCE - BUTTON_PADDING;

export default function Tutorial() {
  const scrollRef = useRef(null);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const goBack = () => {
    router.back();
  };

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const handleCompleteTutorial = async () => {
    try {
      await SecureStore.setItemAsync("hasCompletedTutorial", "true");

      router.replace("/home");
    } catch (error) {
      console.error("튜토리얼 완료 상태 저장 실패:", error);
      Alert.alert("오류", "처리 중 문제가 발생했습니다.");
    }
  };

  const onNext = () => {
    if (currentIndex < pages.length - 1) {
      scrollRef.current.scrollTo({
        x: width * (currentIndex + 1),
        animated: true
      });
    } else {
      handleCompleteTutorial();
      router.push("/home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {pages.map((page, idx) => (
          <View key={idx} style={styles.page}>
            <Image source={page.image} style={styles.pageImage} />
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.subtitle}>{page.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {pages.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextText}>{currentIndex < pages.length - 1 ? "다음" : "확인"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f4"
  },
  backButton: {
    position: "absolute",
    top: absoluteTopPosition,
    left: absoluteLeftPosition,
    padding: BUTTON_PADDING,
    zIndex: 1
  },
  backicon: { width: 12, height: ICON_HEIGHT },
  scrollView: { flex: 1 },
  contentContainer: { alignItems: "center" },
  page: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30
  },
  pageImage: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: 24,
    resizeMode: "contain"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555"
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6
  },
  dotActive: { backgroundColor: "rgba(214, 128, 137, 0.7)" },
  dotInactive: { backgroundColor: "#D9D9D9" },
  buttonContainer: {
    paddingHorizontal: 30
  },
  nextButton: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(214, 128, 137, 0.7)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 26
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
