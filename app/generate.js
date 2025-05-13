import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import IconButton from "../components/IconButton";
import { usePhoto } from "../contexts/PhotoContext";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const screenWidth = Dimensions.get("window").width;

export default function GeneratePage() {
  const flatListRef = useRef(null);
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;

  const nav = useRouter();
  const { photos: rawPhotos = "{}" } = useLocalSearchParams();
  const { photoList } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [editingKeywordPhotoId, setEditingKeywordPhotoId] = useState(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [allKeywords, setAllKeywords] = useState([]);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => !hiddenIds.includes(photo.id)),
    [photos, hiddenIds]
  );

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < visiblePhotos.length) {
      flatListRef.current?.scrollToIndex({
        index: nextIdx,
        animated: true,
        viewPosition: 0,
      });
      setCurrentIndex(nextIdx);
    }
  };
  const finalizedPhotos = visiblePhotos.map((photo, index) => ({
    photoId: photo.id,
    sequence: index,
    keyword: keywords[photo.id] ?? [],
  }));

  const handleComplete = () => {
    // TODO: 필요한 데이터(photos, keywords, mainPhotoId 등)를 쿼리스트링이나 state로 전달
    nav.push({
      pathname: "/loadingDiary",
      params: {
        photos: JSON.stringify(visiblePhotos),
        keywords: JSON.stringify(keywords),
        mainPhotoId,
      },
    });
  };

  const isLast = currentIndex === visiblePhotos.length - 1;

  const handleDragBegin = useCallback((index) => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(({ data }) => {
    setPhotos(data);
    setKeywords((prev) => {
      const reordered = {};
      data.forEach((photo) => {
        reordered[photo.id] = prev[photo.id] || [];
      });
      return reordered;
    });
  }, []);
  const fetchKeywordsFromAPI = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      return json;
    } catch (err) {
      console.error("키워드 API 호출 실패:", err);
      return [];
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const parsed = JSON.parse(rawPhotos);
        const recommendedPhotoIds = parsed?.recommendedPhotoIds;
        if (!Array.isArray(recommendedPhotoIds)) return;

        const filtered = photoList.filter((photo) =>
          recommendedPhotoIds.includes(photo.id)
        );
        setPhotos(filtered);
        if (filtered.length > 0) setMainPhotoId(filtered[0].id);

        const keywordsFromAPI = await fetchKeywordsFromAPI();
        const keywordNames = keywordsFromAPI.map((k) => `#${k.name}`);
        setAllKeywords(keywordNames);

        const keywordMap = filtered.reduce((acc, photo) => {
          acc[photo.id] = [];
          return acc;
        }, {});
        setKeywords(keywordMap);
      } catch (err) {
        console.error("초기화 중 오류:", err);
      }
    };

    initialize();
  }, [rawPhotos, photoList]);

  const handleAddKeyword = (id) => {
    setEditingKeywordPhotoId(id);
    setNewKeyword("");
  };

  const handleKeywordSubmit = () => {
    const trimmed = newKeyword.trim();

    if (!trimmed) {
      setEditingKeywordPhotoId(null);
      setNewKeyword("");
      return;
    }

    const formatted = `#${trimmed}`;

    setKeywords((prev) => {
      const current = prev[editingKeywordPhotoId] || [];

      if (current.includes(formatted)) {
        return prev;
      }

      return {
        ...prev,
        [editingKeywordPhotoId]: [...current, formatted],
      };
    });

    setEditingKeywordPhotoId(null);
    setNewKeyword("");
  };

  const toggleKeywordSelection = (photoId, keyword) => {
    setKeywords((prev) => {
      const current = prev[photoId] || [];

      const updated = current.includes(keyword)
        ? current.filter((kw) => kw !== keyword)
        : [...current, keyword];

      return {
        ...prev,
        [photoId]: updated,
      };
    });
  };

  const handleHidePhoto = (id) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          onPress={() => nav.push("/confirmPhoto")}
        />
        <Text style={styles.title}>포커스 키워드 설정</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={styles.subtitle}>
        AI일기 생성 퀄리티를 위해 각 사진의 포커스를 지정해주세요!
      </Text>

      <DraggableFlatList
        ref={flatListRef}
        data={visiblePhotos}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
          }
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        renderItem={({ item, drag }) => (
          <ScaleDecorator>
            <View style={styles.cardWrapper}>
              <View style={styles.cardShadowWrapper}>
                <TouchableOpacity onPressIn={drag} activeOpacity={1}>
                  <View style={styles.card}>
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={styles.cardImage}
                    />
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
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.keywordContainer}>
                {/* 🔹 공통 키워드 */}
                {allKeywords.map((kw, i) => {
                  const isSelected = keywords[item.id]?.includes(kw);
                  return (
                    <TouchableOpacity
                      key={`common-${i}`}
                      style={[
                        styles.keywordTag,
                        isSelected && styles.selectedKeywordTag,
                      ]}
                      onPress={() => toggleKeywordSelection(item.id, kw)}
                    >
                      <Text
                        style={[
                          styles.keywordText,
                          isSelected && styles.selectedKeywordText,
                        ]}
                      >
                        {kw}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {(keywords[item.id] || [])
                  .filter((kw) => !allKeywords.includes(kw))
                  .map((kw, i) => {
                    return (
                      <TouchableOpacity
                        key={`custom-${i}`}
                        style={[styles.keywordTag, styles.selectedKeywordTag]}
                        onPress={() => toggleKeywordSelection(item.id, kw)} // ← 토글 추가
                      >
                        <Text style={styles.selectedKeywordText}>{kw}</Text>
                      </TouchableOpacity>
                    );
                  })}

                {editingKeywordPhotoId === item.id ? (
                  <TextInput
                    value={newKeyword}
                    onChangeText={setNewKeyword}
                    placeholder="새 키워드"
                    style={styles.keywordInputInline}
                    onSubmitEditing={handleKeywordSubmit}
                    autoFocus
                    returnKeyType="done"
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.addKeyword}
                    onPress={() => handleAddKeyword(item.id)}
                  >
                    <Text style={styles.addText}># +</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScaleDecorator>
        )}
        activationDistance={20}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        scrollEnabled
        dragItemOverflow
        vertical
        pagingEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 250 }}
      />

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={isLast ? handleComplete : handleNext}
        >
          <Text style={styles.nextText}>{isLast ? "완료" : "다음"}</Text>
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
    paddingTop: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FCF9F4",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    color: "#a78c7b",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#a78c7b",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 5,
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: "center",
    marginBottom: 30,
  },
  cardShadowWrapper: {
    marginTop: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
  },
  card: {
    width: screenWidth * 0.8,
    aspectRatio: 1,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
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
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff",
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  closeWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
  keywordContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
    paddingHorizontal: 45,
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
  keywordInputInline: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 13,
    color: "#3f3f3f",
    minWidth: 60,
  },
  selectedKeywordTag: {
    backgroundColor: "#D68089",
    borderColor: "#D68089",
  },
  selectedKeywordText: {
    color: "#fff",
  },

  bottomRow: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 30,
  },
  nextButton: {
    backgroundColor: "#D9A2A8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
