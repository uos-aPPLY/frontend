import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  DeviceEventEmitter,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import IconButton from "../../components/IconButton";
import HeaderDateAndTrash from "../../components/Header/HeaderDateAndTrash";
import ImageSlider from "../../components/ImageSlider";
import { parseISO, set } from "date-fns";
import characterList from "../../assets/characterList";
import fullHeartIcon from "../../assets/icons/fullhearticon.png";
import emptyHeartIcon from "../../assets/icons/emptyhearticon.png";
import viewIcon from "../../assets/icons/viewicon.png";
import oneViewIcon from "../../assets/icons/oneviewicon.png";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { usePhoto } from "../../contexts/PhotoContext";
import { useDiary } from "../../contexts/DiaryContext";
import DebugDiaryState from "../../debug/DebugDiaryState";

const screenWidth = Dimensions.get("window").width;

export default function DiaryPage() {
  const nav = useRouter();
  const { token } = useAuth();
  const { setPhotoList, setTempPhotoList, setMainPhotoId } = usePhoto();
  const { date: dateParam } = useLocalSearchParams();
  const date = dateParam;
  const parsedDate = parseISO(date);
  const {
    resetDiary,
    setDiaryId,
    setDiaryMapById,
    setText,
    setSelectedCharacter,
    setSelectedDate,
  } = useDiary();

  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const characterObj = diary
    ? characterList.find((c) => c.name === diary.emotionIcon)
    : null;

  const confirmDiaryStatus = useCallback(async (diaryId, currentStatus) => {
    if (currentStatus === "confirmed" || !diaryId) {
      return;
    }

    try {
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${diaryId}/confirm`,
        {
          method: "PATCH",
        }
      );
      if (res.ok) {
        console.log(
          `Diary ${diaryId} status confirmed successfully via /confirm endpoint.`
        );
        setDiary((prevDiary) => {
          if (prevDiary && prevDiary.id === diaryId) {
            return { ...prevDiary, status: "confirmed" };
          }
          return prevDiary;
        });
        DeviceEventEmitter.emit("refreshCalendar");
      } else {
        const errorText = await res.text();
        console.warn(
          `Failed to confirm diary ${diaryId} status via /confirm: ${res.status}`,
          errorText
        );
      }
    } catch (error) {
      console.error(
        `Error confirming diary ${diaryId} status via /confirm:`,
        error
      );
    }
  }, []);

  const toggleFavorite = async () => {
    if (!diary || !token) return;
    try {
      setIsFavoriteLoading(true);
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${diary.id}/favorite`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isFavorited: !diary.isFavorited }),
        }
      );
      if (res.ok) {
        setDiary((prev) => ({
          ...prev,
          isFavorited: !prev.isFavorited,
        }));
      } else {
        console.warn("❌ 즐겨찾기 API 실패:", res.status);
      }
    } catch (err) {
      console.error("📛 즐겨찾기 토글 실패", err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  function formatPhotosInRows(photos, columns = 3) {
    const rows = [];
    const photoCopy = [...photos];
    while (photoCopy.length > 0) {
      const row = photoCopy.splice(0, columns);
      while (row.length < columns) {
        row.push(null);
      }
      rows.push(row);
    }
    return rows;
  }

  const deleteDiary = async () => {
    if (!diary || !token) return;
    try {
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${diary.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        console.log("🗑️ 일기 삭제 성공");
        resetDiary();
        setPhotoList([]);
        setTempPhotoList([]);
        setMainPhotoId(null);
        nav.push("/calendar");
      } else {
        console.warn("❌ 일기 삭제 실패:", res.status);
      }
    } catch (error) {
      console.error("📛 삭제 요청 실패", error);
    }
  };

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const res = await fetch(
          `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/by-date?date=${date}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          setDiary(undefined);
          return;
        }

        const text = await res.text();
        if (!text) {
          setDiary(undefined);
          return;
        }

        const data = JSON.parse(text);
        console.log("📓 불러온 다이어리 데이터:", data);
        setDiary(data);
        setDiaryId(data.id);
        setDiaryMapById((prev) => ({
          ...prev,
          [data.id]: data,
        }));

        setText(data.content || "");

        const characterFound = characterList.find(
          (c) => c.name === data.emotionIcon
        );
        if (characterFound) {
          setSelectedCharacter(characterFound);
        }

        const [year, month, day] = data.diaryDate.split("-").map(Number);
        const localDate = new Date(year, month - 1, day);
        setSelectedDate(localDate);

        setPhotoList(data.photos || []);
        setTempPhotoList(data.photos || []);
        const found = data.photos.find(
          (p) => p.photoUrl === data.representativePhotoUrl
        );
        if (found) {
          setMainPhotoId(String(found.id));
        }

        if (data && data.id && typeof data.status !== "undefined") {
          await confirmDiaryStatus(data.id, data.status);
        }
      } catch (error) {
        console.error("📛 다이어리 로딩 실패", error);
        setDiary(undefined);
      } finally {
        setLoading(false);
      }
    };

    if (date && token) fetchDiary();
  }, [date, token, setMainPhotoId, confirmDiaryStatus]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.loadingText}>일기를 불러오는 중이에요...</Text>
      </View>
    );
  }

  if (diary === undefined) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loadingText}>해당 날짜에 일기가 없습니다.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => nav.push("/calendar")}
        >
          <Text style={styles.backButtonText}>캘린더로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photosToShow = diary.photos || [];

  return (
    <View style={styles.container}>
      <HeaderDateAndTrash
        date={parsedDate}
        onBack={() => {
          resetDiary();
          setPhotoList([]);
          setTempPhotoList([]);
          setMainPhotoId(null);
          nav.push("/calendar");
        }}
        onTrashPress={() => setShowConfirmModal(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {photosToShow.length > 0 ? (
          <ImageSlider
            photos={photosToShow}
            isGridView={isGridView}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            flatListRef={flatListRef}
          />
        ) : (
          <View style={styles.shadowWrapper}>
            <View style={styles.noPhotoWrapper}>
              <Text style={styles.noPhotoText}>사진이 없어요.</Text>
            </View>
          </View>
        )}

        <View style={styles.middle}>
          <View style={styles.iconRow}>
            <View style={{ width: 96 }} />
            <View style={styles.characterWrapper}>
              <Image source={characterObj?.source} style={styles.character} />
            </View>
            <View style={styles.iconGroup}>
              <IconButton
                source={require("../../assets/icons/pencilicon.png")}
                hsize={24}
                wsize={24}
                onPress={() =>
                  nav.push({
                    pathname: "/edit",
                    params: { id: diary.id.toString() },
                  })
                }
              />
              <IconButton
                source={isGridView ? oneViewIcon : viewIcon}
                hsize={24}
                wsize={24}
                onPress={() => setIsGridView((prev) => !prev)}
                disabled={
                  photosToShow.length === 0 || photosToShow.length === 1
                }
              />
              <IconButton
                source={diary.isFavorited ? fullHeartIcon : emptyHeartIcon}
                hsize={24}
                wsize={24}
                onPress={toggleFavorite}
                disabled={isFavoriteLoading}
              />
            </View>
          </View>
        </View>

        <Text style={styles.cardText}>{diary.content}</Text>
      </ScrollView>

      <ConfirmModal
        visible={showConfirmModal}
        title="정말로 일기를 삭제하시겠어요?"
        message="삭제된 일기는 휴지통에 보관돼요."
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          deleteDiary();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#A78C7B",
  },

  middle: {
    marginTop: 10,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 35,
  },
  characterWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  character: {
    width: 42,
    height: 40,
    resizeMode: "contain",
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: {
    backgroundColor: "#fff",
    color: "#A78C7B",
    fontSize: 16,
    lineHeight: 26,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginHorizontal: 30,
    minHeight: 360,
    marginBottom: 40,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#D68089",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  shadowWrapper: {
    paddingTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
    paddingHorizontal: 30,
  },
  noPhotoWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  noPhotoText: {
    fontSize: 14,
    color: "#A78C7B",
  },
});
