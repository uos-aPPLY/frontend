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
import DraggableFlatList from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";
import { usePhoto } from "../contexts/PhotoContext";
import Constants from "expo-constants";
import ConfirmModal from "../components/Modal/ConfirmModal";
import colors from "../constants/colors";
// import CreationFlowProgress from "../components/CreationFlowProgress";

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = screenWidth - 112;
const CARD_GAP = 14;
const SIDE_PADDING = (screenWidth - CARD_WIDTH) / 2;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

function normalizeKeywordInput(value) {
  return value.replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

function toKeywordLabel(value) {
  const normalized = normalizeKeywordInput(value);
  return normalized ? `#${normalized}` : "";
}

function getKeywordKey(value) {
  return normalizeKeywordInput(value).toLocaleLowerCase();
}

function uniqueKeywords(values) {
  const seen = new Set();

  return values.filter((value) => {
    const key = getKeywordKey(value);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

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
  const [customKeywordPool, setCustomKeywordPool] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [targetDeletePhotoId, setTargetDeletePhotoId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const placeholderIndexRef = useRef(0);

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
      flatListRef.current?.scrollToOffset?.({
        offset: Math.max(0, nextIdx * SNAP_INTERVAL),
        animated: true
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

      // ✅ 첫 번째 사진을 대표사진으로 설정 (selected가 비어있을 수 있으므로)
      if (tempPhotos.length > 0) {
        setMainPhotoId(tempPhotos[0].id);
      }

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

    // ✅ 대표사진이 없거나 현재 보이는 사진에 없으면 첫 번째로 설정
    if (!mainPhotoId || !visible.some((p) => p.id === mainPhotoId)) {
      if (visible.length > 0) {
        console.log("🔄 대표사진 재설정:", visible[0].id);
        setMainPhotoId(visible[0].id);
      } else {
        console.log("⚠️ 보이는 사진이 없음");
        setMainPhotoId(null);
      }
    }
  }, [hiddenIds, photos, mainPhotoId]);

  const handleAddKeyword = (id) => {
    setEditingKeywordPhotoId(id);
    setNewKeyword("");
  };

  const handleKeywordSubmit = () => {
    const formattedKeyword = toKeywordLabel(newKeyword);
    if (!formattedKeyword) {
      setEditingKeywordPhotoId(null);
      setNewKeyword("");
      return;
    }

    const existingKeywords = keywords[editingKeywordPhotoId] || [];
    const keywordKey = getKeywordKey(formattedKeyword);
    const reusableKeyword =
      [...allKeywords, ...customKeywordPool, ...existingKeywords].find(
        (keyword) => getKeywordKey(keyword) === keywordKey
      ) || formattedKeyword;

    if (existingKeywords.some((keyword) => getKeywordKey(keyword) === keywordKey)) {
      Alert.alert("중복 키워드", "이미 추가된 키워드입니다.");
      setEditingKeywordPhotoId(null);
      setNewKeyword("");
      return;
    }

    setKeywords((prev) => ({
      ...prev,
      [editingKeywordPhotoId]: [...existingKeywords, reusableKeyword]
    }));
    setCustomKeywordPool((prev) => uniqueKeywords([reusableKeyword, ...prev]));

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
    // ✅ 실제로 보이는 사진 개수 (visiblePhotos 기준)
    const currentVisibleCount = visiblePhotos.length;

    console.log("🗑️ 삭제 시도:", id, "현재 보이는 사진 수:", currentVisibleCount);

    if (currentVisibleCount <= 1) {
      Alert.alert("삭제 불가", "마지막 사진은 삭제할 수 없습니다.");
      return;
    }

    console.log("🗑️ 사진 삭제:", id, "현재 대표사진:", mainPhotoId);

    // ✅ hiddenIds에 추가 (useEffect가 대표사진 재설정을 담당)
    setHiddenIds((prev) => [...prev, id]);
  };
  const handleDragEnd = useCallback(
    ({ data, to }) => {
      setIsReordering(false);
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

      const nextIndex = Math.max(0, Math.min(data.length - 1, to));
      setCurrentIndex(nextIndex);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset?.({
          offset: Math.max(0, nextIndex * SNAP_INTERVAL),
          animated: true
        });
      });
    },
    [selected]
  );

  const getOrderedKeywordOptions = useCallback(
    (photoId) => {
      const selectedKeywords = keywords[photoId] || [];
      const defaultKeywordKeys = new Set(allKeywords.map(getKeywordKey));

      return uniqueKeywords([...selectedKeywords, ...allKeywords, ...customKeywordPool]).sort(
        (left, right) => {
          const leftSelected = selectedKeywords.some(
            (keyword) => getKeywordKey(keyword) === getKeywordKey(left)
          );
          const rightSelected = selectedKeywords.some(
            (keyword) => getKeywordKey(keyword) === getKeywordKey(right)
          );

          if (leftSelected !== rightSelected) {
            return leftSelected ? -1 : 1;
          }

          const leftIsDefault = defaultKeywordKeys.has(getKeywordKey(left));
          const rightIsDefault = defaultKeywordKeys.has(getKeywordKey(right));

          if (leftIsDefault !== rightIsDefault) {
            return leftIsDefault ? -1 : 1;
          }

          return left.localeCompare(right, "ko");
        }
      );
    },
    [allKeywords, customKeywordPool, keywords]
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

      {/* <CreationFlowProgress
        currentStep={4}
        subtitle="사진마다 포커스 키워드를 붙이면 AI가 더 정확하게 기록해요."
      /> */}

      <Text style={styles.subtitle}>
        AI일기 생성 퀄리티를 위해 각 사진의 포커스를 지정해주세요!
      </Text>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {visiblePhotos.length > 0 && (
          <View style={styles.pageIndicator}>
            {visiblePhotos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id?.toString() ?? `photo-${index}`}
                onPress={() => {
                  flatListRef.current?.scrollToOffset?.({
                    offset: Math.max(0, index * SNAP_INTERVAL),
                    animated: true
                  });
                  setCurrentIndex(index);
                }}
                style={styles.indicatorItem}
              >
                {currentIndex === index ? (
                  <Image source={{ uri: photo.photoUrl }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.dot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <DraggableFlatList
          ref={flatListRef}
          data={visiblePhotos}
          keyExtractor={(item) => item?.id?.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const rawIndex = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
            const clampedIndex = Math.max(0, Math.min(visiblePhotos.length - 1, rawIndex));
            setCurrentIndex(clampedIndex);
          }}
          renderItem={({ item, drag, isActive, getIndex }) => {
            const itemIndex = getIndex?.() ?? 0;

            return (
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={() => {
                  setIsReordering(true);
                  placeholderIndexRef.current = itemIndex;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  drag();
                }}
                delayLongPress={260}
              >
                <View style={styles.cardWrapper}>
                  <View style={[styles.cardShadowWrapper, isActive && styles.activeCardShadow]}>
                    <View style={styles.card}>
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
                  </View>

                  <View style={styles.keywordContainer}>
                    <Text style={styles.keywordHelper}>
                      {(keywords[item.id] || []).length > 0
                        ? `선택된 키워드 ${(keywords[item.id] || []).length}개`
                        : "탭해서 고르거나 직접 추가해보세요."}
                    </Text>

                    {getOrderedKeywordOptions(item.id).map((kw, i) => {
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

                    {editingKeywordPhotoId === item.id ? (
                      <View style={styles.keywordInputRow}>
                        <TextInput
                          value={newKeyword}
                          onChangeText={setNewKeyword}
                          placeholder="#새 키워드"
                          style={styles.keywordInputInline}
                          onSubmitEditing={handleKeywordSubmit}
                          onBlur={handleKeywordSubmit}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.keywordAddButton}
                          onPress={handleKeywordSubmit}
                        >
                          <Text style={styles.keywordAddButtonText}>추가</Text>
                        </TouchableOpacity>
                      </View>
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
              </TouchableOpacity>
            );
          }}
          activationDistance={18}
          onDragBegin={(index) => {
            setIsReordering(true);
            placeholderIndexRef.current = index;
          }}
          onRelease={() => setIsReordering(false)}
          onPlaceholderIndexChange={(index) => {
            if (index == null || index < 0 || index === placeholderIndexRef.current) {
              return;
            }

            placeholderIndexRef.current = index;
            Haptics.selectionAsync().catch(() => {});
          }}
          dragItemOverflow
          snapToInterval={isReordering ? undefined : SNAP_INTERVAL}
          decelerationRate={isReordering ? "normal" : "fast"}
          snapToAlignment="start"
          autoscrollThreshold={32}
          autoscrollSpeed={90}
          contentContainerStyle={styles.listContent}
          containerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          extraData={{ editingKeywordPhotoId, keywords, mainPhotoId, isReordering }}
          onDragEnd={handleDragEnd}
        />

        {visiblePhotos.length > 1 ? (
          <Text style={styles.reorderHint}>
            {isReordering
              ? "좌우로 움직여 사진 순서를 바꿀 수 있어요."
              : "사진을 길게 눌러 좌우로 움직이면 순서를 바꿀 수 있어요."}
          </Text>
        ) : null}
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
  listContainer: {
    flex: 1
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    height: 22,
    marginTop: 6,
    marginBottom: 10
  },
  indicatorItem: {
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#D9D9D9"
  },
  thumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4
  },
  listContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 12,
    paddingBottom: 260
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    alignItems: "center"
  },
  cardShadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
    overflow: "visible"
  },
  activeCardShadow: {
    transform: [{ scale: 1.03 }]
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
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
    paddingHorizontal: 8,
    paddingBottom: 8
  },
  keywordHelper: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    color: "#9B8678",
    marginBottom: 4
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
  keywordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
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
    lineHeight: 16,
    minWidth: 104
  },
  keywordAddButton: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D68089",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  keywordAddButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff"
  },
  reorderHint: {
    marginTop: 8,
    marginBottom: 6,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#A78C7B",
    paddingHorizontal: 36
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
