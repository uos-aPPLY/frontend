import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import IconButton from "../components/IconButton";
import CardPicture from "../components/CardPicture";
import { usePhoto } from "../contexts/PhotoContext";

const screenWidth = Dimensions.get("window").width;

export default function GeneratePage() {
  const nav = useRouter();
  const { photos: rawPhotos = "{}" } = useLocalSearchParams();
  const { photoList } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    try {
      const parsed = JSON.parse(rawPhotos);
      const recommendedPhotoIds = parsed?.recommendedPhotoIds;

      if (!Array.isArray(recommendedPhotoIds)) return;

      const filtered = photoList.filter((photo) =>
        recommendedPhotoIds.includes(photo.id)
      );

      setPhotos(filtered);
      setMainPhotoId(recommendedPhotoIds[0]);
      setKeywords(
        filtered.map(() => ["#인물", "#사물", "#음식", "#동물", "#풍경"])
      );
    } catch (err) {
      console.error("추천 사진 파싱 오류:", err);
    }
  }, [rawPhotos, photoList]);

  const handleAddKeyword = (index) => {
    const newKeywords = [...keywords];
    newKeywords[index].push(`#새키워드${newKeywords[index].length + 1}`);
    setKeywords(newKeywords);
  };

  const handleHidePhoto = (id) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  const visiblePhotos = photos.filter((photo) => !hiddenIds.includes(photo.id));

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

      {/* 사진 썸네일 인디케이터 */}
      <View style={styles.thumbnailRow}>
        {visiblePhotos.map((photo, idx) =>
          currentIndex === idx ? (
            <Image
              key={photo.id}
              source={{ uri: photo.photoUrl }}
              style={styles.activeThumbnail}
            />
          ) : (
            <View key={photo.id} style={styles.inactiveDot} />
          )
        )}
      </View>

      <FlatList
        data={visiblePhotos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <View style={styles.imageSlide}>
            <CardPicture
              id={item.id}
              imageSource={item.photoUrl}
              showControls={true}
              onDelete={() => handleHidePhoto(item.id)}
              isMain={item.id === mainPhotoId}
              onPressMain={() => setMainPhotoId(item.id)}
            />

            <View style={styles.keywordContainer}>
              {keywords[index]?.map((kw, i) => (
                <View key={i} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addKeyword}
                onPress={() => handleAddKeyword(index)}
              >
                <Text style={styles.addText}># +</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextText}>다음</Text>
      </TouchableOpacity>
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
    alignItems: "flex-end",
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    color: "#a78c7b",
    fontWeight: "bold",
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 20,
    marginBottom: 10,
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 4,
    gap: 6,
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
  imageSlide: {
    width: screenWidth,
    paddingTop: 10,
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
  nextButton: {
    backgroundColor: "#D9A2A8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
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
