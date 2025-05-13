import { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import { useDiary } from "../contexts/DiaryContext";
import IconButton from "../components/IconButton";

export default function LoadingDiary() {
  const router = useRouter();
  const { token } = useAuth();
  const { selectedDate } = useDiary();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const nav = useRouter();

  const {
    photos = "[]",
    keywords = "{}",
    mainPhotoId,
  } = useLocalSearchParams();

  const visiblePhotos = JSON.parse(photos);
  const keywordMap = JSON.parse(keywords);

  const finalizedPhotos = visiblePhotos.map((photo, index) => ({
    photoId: photo.id,
    sequence: index,
    keyword: (keywordMap[photo.id] ?? [])
      .map((kw) => kw.replace(/^#/, "")) // "#" 제거
      .join(","),
  }));

  useEffect(() => {
    const diaryDate =
      typeof selectedDate === "string"
        ? selectedDate
        : selectedDate?.toISOString().split("T")[0];

    const createDiary = async () => {
      try {
        const body = {
          diaryDate,
          representativePhotoId: mainPhotoId,
          finalizedPhotos,
        };

        console.log("📦 요청 바디 확인:", JSON.stringify(body, null, 2));

        const res = await fetch(`${BACKEND_URL}/api/diaries/auto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        console.log("📝 응답 받은 일기 데이터:", json);

        const date = json.diaryDate;
        router.replace(`/diaries/${date}`);
      } catch (err) {
        console.error("일기 생성 실패", err);
        router.replace("/home");
      }
    };

    createDiary();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => nav.push("/calendar")}
        />
      </View>

      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.message}>AI가 당신의 하루를 기록 중이에요...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
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
