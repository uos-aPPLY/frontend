import { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import IconButton from "../../components/IconButton";
import HeaderDateAndTrash from "../../components/Header/HeaderDateAndTrash";
import { parseISO } from "date-fns";
import characterList from "../../assets/characterList";
import fullHeartIcon from "../../assets/icons/fullhearticon.png";
import emptyHeartIcon from "../../assets/icons/emptyhearticon.png";
import viewIcon from "../../assets/icons/viewicon.png";
import oneViewIcon from "../../assets/icons/oneviewicon.png";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { usePhoto } from "../../contexts/PhotoContext";

const screenWidth = Dimensions.get("window").width;

export default function DiaryPage() {
  const nav = useRouter();
  const { token } = useAuth();
  const { setMainPhotoId } = usePhoto();
  const { date: dateParam } = useLocalSearchParams();
  const date = dateParam;
  const parsedDate = parseISO(date);

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

        // ✅ 대표사진 ID 추출해서 전역 설정
        const found = data.photos.find(
          (p) => p.photoUrl === data.representativePhotoUrl
        );
        if (found) {
          setMainPhotoId(String(found.id));
        }
      } catch (error) {
        console.error("📛 다이어리 로딩 실패", error);
        setDiary(undefined);
      } finally {
        setLoading(false);
      }
    };

    if (date && token) fetchDiary();
  }, [date, token]);

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
      </View>
    );
  }

  const photosToShow = diary.photos || [];

  return (
    <View style={styles.container}>
      <HeaderDateAndTrash
        date={parsedDate}
        onBack={() => nav.push("/calendar")}
        onTrashPress={() => setShowConfirmModal(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrapper}>
          {isGridView ? (
            <View style={styles.gridContainer}>
              {formatPhotosInRows(photosToShow).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((photo, colIndex) =>
                    photo ? (
                      <Image
                        key={colIndex}
                        source={{ uri: photo.photoUrl }}
                        style={styles.gridImage}
                      />
                    ) : (
                      <View key={colIndex} style={styles.gridImage} />
                    )
                  )}
                </View>
              ))}
            </View>
          ) : (
            <>
              <View style={styles.pageIndicator}>
                {photosToShow.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                      });
                      setCurrentIndex(index);
                    }}
                    style={styles.indicatorItem}
                  >
                    {currentIndex === index ? (
                      <Image
                        source={{ uri: photo.photoUrl }}
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <View style={styles.dot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <FlatList
                ref={flatListRef}
                data={photosToShow}
                keyExtractor={(item, index) =>
                  item.id?.toString() ?? index.toString()
                }
                horizontal
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
            </>
          )}
        </View>

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
  imageWrapper: {
    alignItems: "center",
    marginTop: 5,
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: 30,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    height: 22,
    marginBottom: 10,
  },
  indicatorItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
  },
  thumbnailImage: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  gridContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridImage: {
    width: (screenWidth - 60) / 3,
    height: (screenWidth - 60) / 3,
    backgroundColor: "#EEE",
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
});
