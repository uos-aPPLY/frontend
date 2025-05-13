import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import IconButton from "../components/IconButton";
import { usePhoto } from "../contexts/PhotoContext";

const screenWidth = Dimensions.get("window").width;

export default function GeneratePage() {
  const flatListRef = useRef(null);

  const nav = useRouter();
  const { photos: rawPhotos = "{}" } = useLocalSearchParams();
  const { photoList } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => !hiddenIds.includes(photo.id)),
    [photos, hiddenIds]
  );

  const handleDragBegin = useCallback((index) => {
    console.log("🎯 Drag 시작 인덱스:", index);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    ({ data }) => {
      console.log(
        "✅ Drag 끝:",
        data.map((d) => d.id)
      );
      setPhotos(data);

      // 키워드 순서도 맞춰줌
      const reorderedKeywords = data.map((photo) => {
        const oldIndex = photos.findIndex((p) => p.id === photo.id);
        return keywords[oldIndex] || [];
      });
      setKeywords(reorderedKeywords);
    },
    [photos, keywords]
  );

  useEffect(() => {
    try {
      const parsed = JSON.parse(rawPhotos);
      const recommendedPhotoIds = parsed?.recommendedPhotoIds;

      if (!Array.isArray(recommendedPhotoIds)) return;

      const filtered = photoList.filter((photo) =>
        recommendedPhotoIds.includes(photo.id)
      );
      console.log("😃추천 사진 목록:", filtered);

      setPhotos(filtered);
      if (filtered.length > 0) {
        setMainPhotoId(filtered[0].id);
      }

      setKeywords(
        filtered.reduce((acc, photo) => {
          acc[photo.id] = ["#인물", "#사물", "#음식", "#동물", "#풍경"];
          return acc;
        }, {})
      );
    } catch (err) {
      console.error("최초 추천 사진 파싱 오류:", err);
    }
  }, [rawPhotos, photoList]);

  const handleAddKeyword = (id) => {
    setKeywords((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), `#새키워드${(prev[id]?.length || 0) + 1}`],
    }));
  };

  const handleHidePhoto = (id) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          onPress={() => nav.push("/confirmPhoto")}
        />
        <Text style={styles.title}>포커스 키워드 & 순서 설정</Text>
        <View style={{ width: 22 }} />
      </View>
      {/* 사진 써모니 인디케이터 */}
      <View style={styles.thumbnailRow}>
        {visiblePhotos.map((photo, idx) => (
          <TouchableOpacity
            key={photo.id}
            onPress={() => {
              if (flatListRef.current?.scrollToIndex) {
                flatListRef.current.scrollToIndex({
                  index: idx,
                  animated: true,
                });
                setCurrentIndex(idx);
              } else {
                console.warn("❌ scrollToIndex 지원 안 됨");
              }
            }}
          >
            {currentIndex === idx ? (
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.activeThumbnail}
              />
            ) : (
              <View style={styles.inactiveDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <DraggableFlatList
        ref={flatListRef}
        containerStyle={{ flex: 1 }}
        data={visiblePhotos}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled={!isDragging}
        horizontal
        scrollEnabled
        dragItemOverflow={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        onScrollOffsetChange={(offset) => {
          const newIndex = Math.round(offset / screenWidth);
          setCurrentIndex(newIndex);
        }}
        showsHorizontalScrollIndicator={false}
        activationDistance={20}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag }) => {
          //console.log("🧩 Rendered:", item.id);
          return (
            <>
              <ScaleDecorator>
                <View style={styles.imageSlide}>
                  <TouchableOpacity onPressIn={drag} activeOpacity={1}>
                    <View style={styles.shadowWrapper}>
                      <View style={styles.card}>
                        <Image
                          source={{ uri: item.photoUrl }}
                          style={styles.cardImage}
                        />
                        <>
                          <TouchableOpacity
                            style={[
                              styles.badgeOverlay,
                              item.id === mainPhotoId
                                ? styles.badgeActive
                                : styles.badgeInactive,
                            ]}
                            onPress={() => setMainPhotoId(item.id)}
                          >
                            <Text style={styles.badgeText}>대표 사진</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.closeWrapper}
                            onPress={() => handleHidePhoto(item.id)}
                          >
                            <Image
                              source={require("../assets/icons/xicon.png")}
                              style={styles.closeIconImg}
                            />
                          </TouchableOpacity>
                        </>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScaleDecorator>

              <View style={styles.keywordContainer}>
                {keywords[item.id]?.map((kw, i) => (
                  <View key={i} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{kw}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addKeyword}
                  onPress={() => handleAddKeyword(item.id)}
                >
                  <Text style={styles.addText}># +</Text>
                </TouchableOpacity>
              </View>
            </>
          );
        }}
      />

      <View style={styles.Row}>
        <TouchableOpacity style={styles.nextButton}>
          <Text style={styles.nextText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  header: {
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 75,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FCF9F4",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    color: "#a78c7b",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  activeThumbnail: {
    width: 22,
    height: 22,
    borderRadius: 4,
    opacity: 1,
  },
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
    marginHorizontal: 30,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    resizeMode: "cover",
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 5,
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff",
    borderWidth: 0.5,
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff",
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  closeWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 5,
  },
  closeIconImg: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
  imageSlide: {
    width: screenWidth,
    height: screenWidth + 300,
    paddingTop: 20,
    paddingBottom: 120,
    alignItems: "center",
  },
  keywordContainer: {
    flexDirection: "row",
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  keywordTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  keywordText: {
    fontSize: 13,
    color: "#3f3f3f",
  },
  addKeyword: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addText: {
    fontSize: 13,
    color: "#3f3f3f",
  },
  Row: {
    flex: 1,
    justifyContent: "flex-end",
  },
  nextButton: {
    backgroundColor: "#D9A2A8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "fl",
    marginHorizontal: 30,
    marginTop: 20,
    marginBottom: 60,
  },
  nextText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
