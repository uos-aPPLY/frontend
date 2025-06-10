// app/generate.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";
import { usePhoto } from "../contexts/PhotoContext";
import Constants from "expo-constants";
import ConfirmModal from "../components/Modal/ConfirmModal";
import colors from "../constants/colors";

const screenWidth = Dimensions.get("window").width;

export default function GeneratePage() {
  const nav = useRouter();
  const flatListRef = useRef(null);
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;

  const { mode, selected, setSelected, setPhotoList, originalPhotoList } = usePhoto(); // 🔧 추가

  const [photos, setPhotos] = useState([]);
  const [keywords, setKeywords] = useState({});
  const [hiddenIds, setHiddenIds] = useState([]);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingKeywordPhotoId, setEditingKeywordPhotoId] = useState(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [allKeywords, setAllKeywords] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [targetDeletePhotoId, setTargetDeletePhotoId] = useState(null);

  console.log("selected:", selected);
  console.log(
    "visiblePhoto IDs:",
    photos.filter((p) => !hiddenIds.includes(p.id)).map((p) => p.id)
  );
  console.log("mode:", mode);

  useEffect(() => {
    console.log("🖼️ 현재 대표사진 ID:", mainPhotoId);
  }, [mainPhotoId]);

  useEffect(() => {
    return () => {
      // 페이지 unmount 시 selected 초기화
      setSelected([]);
      setPhotoList(originalPhotoList); // 이전 사진 복원도 같이
    };
  }, []);

  const visiblePhotos = useMemo(() => {
    const filtered = selected
      .map((sel) => {
        const targetId = typeof sel === "object" ? sel.id : sel;
        const found = photos.find((p) => String(p.id) === String(targetId));
        if (!found) {
          console.warn("⚠️ selected에 해당하는 사진 없음:", targetId);
        }
        return found;
      })
      .filter((p) => p && !hiddenIds.includes(p.id));
    return filtered;
  }, [photos, hiddenIds, selected]);

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < visiblePhotos.length) {
      flatListRef.current?.scrollToIndex({
        index: nextIdx,
        animated: true,
        viewPosition: 0
      });
      setCurrentIndex(nextIdx);
    }
  };

  const filteredKeywords = useMemo(() => {
    const filtered = {};
    visiblePhotos.forEach((p) => {
      filtered[p.id] = keywords[p.id] || [];
    });
    return filtered;
  }, [visiblePhotos, keywords]);

  const handleComplete = () => {
    nav.push({
      pathname: "/loading/loadingDiary",
      params: {
        photos: JSON.stringify(visiblePhotos), // ✅ 숨겨지지 않은 것만
        keywords: JSON.stringify(filteredKeywords), // ✅ 숨겨진 사진 키워드 제외
        mainPhotoId: visiblePhotos.some((p) => p.id === mainPhotoId)
          ? mainPhotoId
          : visiblePhotos[0]?.id // ✅ 대표사진도 유효성 체크
      }
    });
    setSelected([]); // ✅ 완료 후 선택 초기화
  };

  const fetchKeywordsFromAPI = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      return json.map((k) => `#${k.name}`);
    } catch (err) {
      console.error("❌ 키워드 불러오기 실패:", err);
      return [];
    }
  };
  const isLast = useMemo(
    () => currentIndex >= visiblePhotos.length - 1,
    [currentIndex, visiblePhotos.length]
  );

  const initialize = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const tempPhotos = await res.json();
      if (!Array.isArray(tempPhotos) || tempPhotos.length === 0) {
        console.warn("⚠️ 임시 사진 없음");
        return;
      }

      console.log("✅ 가져온 임시 사진:", tempPhotos);

      setPhotos(tempPhotos);
      setMainPhotoId(typeof selected[0] === "object" ? selected[0].id : Number(selected[0]));

      const fetchedKeywords = await fetchKeywordsFromAPI();
      setAllKeywords(fetchedKeywords);

      const keywordMap = {};
      tempPhotos.forEach((p) => {
        keywordMap[p.id] = [];
      });
      setKeywords(keywordMap);
    } catch (err) {
      console.error("❌ 사진 초기화 실패:", err);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const visible = photos.filter((p) => !hiddenIds.includes(p.id));
    if (!visible.some((p) => p.id === mainPhotoId)) {
      setMainPhotoId(visible[0]?.id ?? null);
    }
  }, [hiddenIds, photos]);

  const handleAddKeyword = (id) => {
    setEditingKeywordPhotoId(id);
    setNewKeyword("");
  };

  const handleKeywordSubmit = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) {
      setEditingKeywordPhotoId(null);
      return;
    }

    const formatted = `#${trimmed}`;
    setKeywords((prev) => ({
      ...prev,
      [editingKeywordPhotoId]: [...(prev[editingKeywordPhotoId] || []), formatted]
    }));

    setEditingKeywordPhotoId(null);
    setNewKeyword("");
  };

  const toggleKeywordSelection = (photoId, keyword) => {
    setKeywords((prev) => {
      const existing = prev[photoId] || [];
      const updated = existing.includes(keyword)
        ? existing.filter((k) => k !== keyword)
        : [...existing, keyword];
      return { ...prev, [photoId]: updated };
    });
  };

  const handleHidePhoto = (id) => {
    const visibleCount = photos.filter((p) => !hiddenIds.includes(p.id)).length;

    if (visibleCount <= 1) {
      Alert.alert("삭제 불가", "마지막 사진은 삭제할 수 없습니다.");
      return;
    }

    setHiddenIds((prev) => {
      const updated = [...prev, id];

      // ✅ mainPhotoId가 삭제되면 새로운 대표 지정
      if (String(mainPhotoId) === String(id)) {
        const remaining = photos.filter((p) => !updated.includes(p.id));
        setMainPhotoId(remaining[0]?.id ?? null);
      }

      return updated;
    });
  };
  const handleDragEnd = useCallback(
    ({ data }) => {
      setPhotos(data);

      // 👉 selected도 새 순서로 업데이트
      const newSelected = data
        .map((photo) =>
          selected.find((sel) => (typeof sel === "object" ? sel.id : sel) === photo.id)
        )
        .filter(Boolean);
      setSelected(newSelected);

      // 키워드 재맵핑
      setKeywords((prev) => {
        const updated = {};
        data.forEach((photo) => {
          updated[photo.id] = prev[photo.id] || [];
        });
        return updated;
      });
    },
    [selected]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          onPress={() => {
            setSelected([]);
            nav.back();
          }}
        />
        <Text style={styles.title}>포커스 키워드 설정</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.subtitle}>
        AI일기 생성 퀄리티를 위해 각 사진의 포커스를 지정해주세요!
      </Text>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DraggableFlatList
          ref={flatListRef}
          data={visiblePhotos}
          keyExtractor={(item) => item?.id?.toString()}
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems.length > 0) {
              setCurrentIndex(viewableItems[0].index ?? 0);
            }
          }}
          dragItemOverflow={false}
          activationDelay={200}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <View style={styles.cardWrapper}>
                <View style={styles.cardShadowWrapper}>
                  <TouchableOpacity onLongPress={drag} delayLongPress={200} activeOpacity={1}>
                    <View
                      style={[
                        styles.card,
                        isActive && {
                          opacity: 0.8,
                          width: screenWidth * 0.62,
                          height: screenWidth * 0.62
                        }
                      ]}
                    >
                      <Image
                        source={{ uri: item.photoUrl }}
                        style={styles.cardImage}
                        onError={() => console.warn("❌ 이미지 로딩 실패:", item.photoUrl)}
                      />

                      <TouchableOpacity
                        style={[
                          styles.badgeOverlay,
                          item.id === mainPhotoId ? styles.badgeActive : styles.badgeInactive
                        ]}
                        onPress={() => {
                          console.log("✅ 대표사진 설정:", item.id);
                          setMainPhotoId(item.id);
                        }}
                      >
                        <Text style={styles.badgeText}>대표 사진</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.closeWrapper}
                        onPress={() => {
                          setTargetDeletePhotoId(item.id);
                          setConfirmModalVisible(true);
                        }}
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
                  {allKeywords.map((kw, i) => {
                    const isSelected = keywords[item.id]?.includes(kw);
                    return (
                      <TouchableOpacity
                        key={`common-${i}`}
                        style={[styles.keywordTag, isSelected && styles.selectedKeywordTag]}
                        onPress={() => toggleKeywordSelection(item.id, kw)}
                      >
                        <Text
                          style={[styles.keywordText, isSelected && styles.selectedKeywordText]}
                        >
                          {kw}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {(keywords[item.id] || [])
                    .filter((kw) => !allKeywords.includes(kw))
                    .map((kw, i) => (
                      <TouchableOpacity
                        key={`custom-${i}`}
                        style={[styles.keywordTag, styles.selectedKeywordTag]}
                        onPress={() => toggleKeywordSelection(item.id, kw)}
                      >
                        <Text style={styles.selectedKeywordText}>{kw}</Text>
                      </TouchableOpacity>
                    ))}

                  {editingKeywordPhotoId === item.id ? (
                    <TextInput
                      value={newKeyword}
                      onChangeText={setNewKeyword}
                      placeholder="새 키워드"
                      style={styles.keywordInputInline}
                      onSubmitEditing={handleKeywordSubmit}
                      onBlur={handleKeywordSubmit}
                      autoFocus
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
          autoscrollThreshold={100}
          autoscrollSpeed={25}
          onDragEnd={handleDragEnd}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 260,
            paddingTop: 20, // ✅ 위쪽 여유도 추가
            minHeight: Dimensions.get("window").height
          }}
        />
      </KeyboardAvoidingView>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            // 키워드 입력 중이면 먼저 반영
            if (editingKeywordPhotoId && newKeyword.trim()) {
              handleKeywordSubmit();
            }

            if (isLast) {
              handleComplete();
            } else {
              handleNext();
            }
          }}
        >
          <Text style={styles.nextText}>{isLast ? "AI 일기 생성하기" : "다음"}</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmModalVisible}
        title="사진 삭제"
        message="정말 이 사진을 삭제하시겠어요?"
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => {
          setConfirmModalVisible(false);
          setTargetDeletePhotoId(null);
        }}
        onConfirm={() => {
          setConfirmModalVisible(false);
          if (targetDeletePhotoId !== null) {
            handleHidePhoto(targetDeletePhotoId);
            setTargetDeletePhotoId(null);
          }
        }}
      />
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
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    color: "#a78c7b",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1
  },
  subtitle: {
    fontSize: 12,
    color: "#a78c7b",
    textAlign: "center",
    paddingTop: 5,
    paddingBottom: 10
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40
  },
  cardShadowWrapper: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30
  },
  card: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    aspectRatio: 1,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative"
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff"
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff"
  },
  badgeText: {
    fontSize: 12,
    color: "#fff"
  },
  closeWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 10
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff"
  },
  keywordContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
    paddingHorizontal: 45
  },
  keywordTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E8E6E3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  selectedKeywordTag: {
    backgroundColor: "#D68089",
    borderColor: "#D68089"
  },
  keywordText: {
    fontSize: 13,
    color: "#3f3f3f"
  },
  selectedKeywordText: {
    color: "#fff",
    fontSize: 13
  },
  addKeyword: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E8E6E3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  addText: {
    fontSize: 13,
    color: "#3f3f3f"
  },
  keywordInputInline: {
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 13,
    color: "#3f3f3f",
    textAlignVertical: "center",
    includeFontPadding: false,
    height: 30,
    lineHeight: 16
  },
  bottomRow: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 30
  },
  nextButton: {
    backgroundColor: colors.pinkpoint,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center"
  },
  nextText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold"
  }
});
