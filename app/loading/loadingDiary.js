import { useEffect, useRef, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import { useDiary } from "../../contexts/DiaryContext";
import IconButton from "../../components/IconButton";
import { DeviceEventEmitter } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../constants/colors";

export default function LoadingDiary() {
  const router = useRouter();
  const nav = useRouter();
  const { token } = useAuth();
  const { selectedDate } = useDiary();
  const { BACKEND_URL } = Constants.expoConfig.extra;

  const isMounted = useRef(false);
  const pollingRef = useRef(null);

  const { date: dateParam, photos = "[]", keywords = "{}", mainPhotoId } = useLocalSearchParams();

  const diaryDate =
    typeof dateParam === "string"
      ? dateParam
      : typeof selectedDate === "string"
      ? selectedDate
      : selectedDate?.toISOString().split("T")[0];

  const visiblePhotos = JSON.parse(photos || "[]");
  const keywordMap = JSON.parse(keywords || "{}");

  const finalizedPhotos = visiblePhotos.map((photo, index) => ({
    photoId: photo.id,
    sequence: index,
    keyword: (keywordMap[photo.id] ?? []).map((kw) => kw.replace(/^#/, "")).join(",")
  }));

  const confirmDiary = async (diaryId, diaryDate) => {
    try {
      const confirmRes = await fetch(`${BACKEND_URL}/api/diaries/${diaryId}/confirm`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (confirmRes.ok) {
        console.log("✅ confirm 성공");
        DeviceEventEmitter.emit("refreshCalendar");
        router.replace(`/diary/${diaryDate}`);
        return true;
      } else {
        console.warn("❌ confirm 실패", confirmRes.status);
      }
    } catch (err) {
      console.error("❗confirm 요청 실패:", err);
    }
    return false;
  };

  const pollDiaryStatus = async (dateToPoll) => {
    const maxRetries = 50;
    let attempts = 0;

    while (attempts < maxRetries && isMounted.current) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/diaries/by-date?date=${dateToPoll}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        console.log("📡 현재 다이어리 상태:", data?.status);

        if (data?.status === "confirmed") {
          DeviceEventEmitter.emit("refreshCalendar");
          router.replace(`/diary/${dateToPoll}`);
          return;
        } else if (data?.status === "unconfirmed" && data?.id) {
          const confirmed = await confirmDiary(data.id, data.diaryDate);
          if (confirmed) return;
        }

        await new Promise((r) => setTimeout(r, 5000));
      } catch (err) {
        console.error("🔁 다이어리 상태 polling 에러:", err);
      }

      attempts++;
    }

    if (isMounted.current) {
      console.warn("⚠️ Polling 실패: 홈으로 이동");
      router.replace("/home");
    } else {
      console.log("⛔️ 포커스 사라짐 - 홈 이동 생략");
    }
  };

  const runCreateOrPoll = useCallback(async () => {
    const shouldCreate =
      photos && keywords && mainPhotoId !== null && typeof diaryDate === "string";

    if (!token || !diaryDate) {
      console.warn("🚫 유효하지 않은 diaryDate 또는 토큰 누락");
      return;
    }

    if (!shouldCreate || visiblePhotos.length === 0) {
      console.log("📌 생성 없이 상태만 polling");
      pollingRef.current = pollDiaryStatus(diaryDate);
      return;
    }

    try {
      const body = {
        diaryDate,
        representativePhotoId: mainPhotoId,
        finalizedPhotos
      };

      console.log("📤 일기 생성 요청:", body);

      const res = await fetch(`${BACKEND_URL}/api/diaries/auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!isMounted.current) return;

      if (json?.status === "confirmed") {
        DeviceEventEmitter.emit("refreshCalendar");
        router.replace(`/diary/${json.diaryDate}`);
      } else if (json?.status === "generating") {
        console.log("🕒 생성 중... polling 시작");
        pollingRef.current = pollDiaryStatus(json.diaryDate);
      } else if (json?.status === "unconfirmed" && json?.id) {
        const confirmed = await confirmDiary(json.id, json.diaryDate);
        if (!confirmed) {
          pollingRef.current = pollDiaryStatus(json.diaryDate);
        }
      } else {
        console.warn("❗예상치 못한 상태:", json?.status);
        router.replace("/home");
      }
    } catch (err) {
      console.error("📛 일기 생성 실패:", err);
      router.replace("/home");
    }
  }, [token, diaryDate]);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      runCreateOrPoll();

      return () => {
        console.log("🔙 뒤로감 또는 화면 이탈 - polling 중단");
        isMounted.current = false;
      };
    }, [runCreateOrPoll])
  );

  return (
    <View style={styles.container}>
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.message}>
          AI가 당신의 하루를 기록 중이에요...
          {"\n"}
          잠시 다른 일을 하셔도 괜찮아요 💫
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => nav.replace({ pathname: "/calendar", params: { date: diaryDate } })}
        >
          <Text style={styles.backButtonText}>캘린더로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: "#A78C7B",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22
  },
  backButton: {
    marginTop: 20,
    backgroundColor: colors.pinkmain,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold"
  }
});
