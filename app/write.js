import { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Text
} from "react-native";
import { useRouter } from "expo-router";
import CharacterPickerOverlay from "../components/CharacterPickerOverlay";
import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { useDiary } from "../contexts/DiaryContext";
import { usePhoto } from "../contexts/PhotoContext";
import { deletePhotoById } from "../utils/clearTempPhotos";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";
import EditImageSlider from "../components/EditImageSlider";
import { openGalleryAndAdd } from "../utils/openGalleryAndAdd";
import ConfirmModal from "../components/Modal/ConfirmModal";
import { clearAllTempPhotos } from "../utils/clearTempPhotos";

const screenWidth = Dimensions.get("window").width;
const MAX_PHOTO_COUNT = 9;

export default function WritePage() {
  const flatListRef = useRef(null);
  const nav = useRouter();

  const {
    text,
    setText,
    selectedCharacter,
    setSelectedCharacter,
    selectedDate,
    setSelectedDate,
    resetDiary
  } = useDiary();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);
  const [isBackConfirmVisible, setIsBackConfirmVisible] = useState(false);

  const {
    photoList,
    setPhotoList,
    mainPhotoId,
    setMainPhotoId,
    resetPhoto,
    setSelectedAssets,
    setMode,
    mode
  } = usePhoto();
  const photosToShow = photoList.length > 0 ? photoList : tempPhotos;
  const date = selectedDate instanceof Date ? selectedDate.toISOString().split("T")[0] : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [targetPhotoId, setTargetPhotoId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedAssets([]);
    if (tempPhotos.length > 0 && photoList.length === 0) {
      setPhotoList(tempPhotos);
      setMainPhotoId(String(tempPhotos[0].id));
    }
  }, [tempPhotos]);

  useEffect(() => {
    if (!mainPhotoId) {
      if (photoList.length > 0) {
        setMainPhotoId(String(photoList[0].id));
      } else if (tempPhotos.length > 0) {
        setMainPhotoId(String(tempPhotos[0].id));
      }
    }
  }, [photoList, tempPhotos]);

  const photosToRender = [...photosToShow];
  if (photosToRender.length < MAX_PHOTO_COUNT) {
    photosToRender.push({ id: "add", type: "add" }); // 가상 항목
  }
  const handleAddPhoto = async () => {
    const addedAssets = await openGalleryAndAdd(token);
    if (!addedAssets || addedAssets.length === 0) return;

    const newPhotos = addedAssets.map((asset) => ({
      id: asset.id,
      photoUrl: asset.photoUrl
    }));

    const updated = [...photosToShow, ...newPhotos];

    // ✅ 항상 전역 상태도 같이 설정
    setPhotoList(updated);
    setTempPhotos(updated); // 여전히 로컬도 유지

    if (!mainPhotoId || !updated.some((p) => String(p.id) === String(mainPhotoId))) {
      setMainPhotoId(String(newPhotos[0].id));
    }
  };

  const handleHidePhoto = (id) => {
    setTargetPhotoId(id);
    setIsConfirmVisible(true);
  };

  const onConfirmDelete = async () => {
    if (!targetPhotoId) return;

    try {
      await deletePhotoById(targetPhotoId, token);

      const updated = photosToShow.filter((p) => p.id !== targetPhotoId);

      setPhotoList(updated);
      setTempPhotos(updated);

      if (String(targetPhotoId) === String(mainPhotoId)) {
        if (updated.length > 0) {
          setMainPhotoId(String(updated[0].id));
          console.log("📸 대표 사진 삭제됨 → 새 대표:", updated[0].id);
        } else {
          setMainPhotoId(null);
          console.log("📸 모든 사진 삭제됨 → 대표 사진 없음");
        }
      }

      if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length - 1);
      }

      setTargetPhotoId(null);
      setIsConfirmVisible(false);
    } catch (err) {
      console.error("❌ 사진 삭제 중 오류:", err);
      setIsConfirmVisible(false);
    }
  };

  const onCancelDelete = () => {
    setTargetPhotoId(null);
    setIsConfirmVisible(false);
  };

  useEffect(() => {
    const fetchTempPhotos = async () => {
      try {
        console.log("📡 fetchTempPhotos 호출됨");
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        console.log("📷 fetchTempPhotos 결과:", data);
        console.log("🧪 현재 대표 사진 상태:", mainPhotoId, typeof mainPhotoId);

        setTempPhotos(data);

        if (
          data.length > 0 &&
          (!mainPhotoId || !data.some((p) => String(p.id) === String(mainPhotoId)))
        ) {
          console.log("📸 대표 사진 초기 세팅:", data[0].id);
          setMainPhotoId(String(data[0].id));
        }
      } catch (error) {
        console.error("임시 사진 불러오기 실패:", error);
      }
    };

    if (token) fetchTempPhotos();
  }, [token]);

  const createDiary = async () => {
    setIsSaving(true); // 👈 로딩 시작

    try {
      const payload = {
        diaryDate: date,
        content: text,
        emotionIcon: selectedCharacter.name,
        photoIds: photosToShow.filter((p) => p.id && p.id !== "add").map((p) => Number(p.id)),
        representativePhotoId: Number(mainPhotoId)
      };

      console.log("📝 일기 생성 요청 페이로드:", payload);

      const res = await fetch(`${BACKEND_URL}/api/diaries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ 일기 생성 실패:", result);
        setIsSaving(false); // ❌ 실패 시 로딩 종료
        return;
      }

      console.log("✅ 일기 생성 성공:", result);
      nav.push("/calendar");
    } catch (err) {
      console.error("❌ 일기 생성 중 에러:", err);
    } finally {
      setIsSaving(false); // ✅ 항상 종료
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.all}>
        <HeaderDate
          date={date}
          onBack={() => {
            if (mode === "write" || mode === "manual" || mode === "ai") {
              setIsBackConfirmVisible(true); // 모달만 띄움
            } else {
              // 기존대로 바로 뒤로가기
              clearAllTempPhotos(token)
                .then(() => {
                  resetDiary();
                  resetPhoto();
                  if (mode === "manual" || mode === "ai") {
                    setMode("bestshot");
                  } else {
                    setMode("choose");
                  }
                  nav.push("/customGallery");
                })
                .catch((err) => {
                  console.error("❌ 뒤로가기 실패:", err);
                  resetDiary();
                  resetPhoto();
                  nav.push("/calendar");
                });
            }
          }}
          hasText={text.trim().length > 0}
          onSave={() => {
            resetDiary();
            createDiary();
            resetPhoto();
          }}
        />

        <View style={styles.middle}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <EditImageSlider
              photos={photosToRender}
              mainPhotoId={mainPhotoId}
              setMainPhotoId={setMainPhotoId}
              onDeletePhoto={handleHidePhoto}
              onAddPhoto={handleAddPhoto}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
            />

            <View style={styles.characterPicker}>
              <View style={{ width: 38, height: 24 }} />
              <IconButton
                source={selectedCharacter.source}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={28}
                hsize={24}
                style={{ marginRight: 10 }}
                onPress={() => nav.push("/photoReorder")}
              />
            </View>

            <View style={styles.low}>
              {isPickerVisible ? (
                <CharacterPickerOverlay
                  visible={isPickerVisible}
                  characterList={characterList}
                  onSelect={(char) => {
                    setSelectedCharacter(char);
                    setIsPickerVisible(false);
                  }}
                />
              ) : (
                <TextBox
                  value={text}
                  onChangeText={setText}
                  placeholder="오늘의 이야기를 써보세요."
                />
              )}

              <ConfirmModal
                visible={isConfirmVisible}
                title="사진 삭제"
                message="정말 이 사진을 삭제하시겠어요?"
                onCancel={onCancelDelete}
                onConfirm={onConfirmDelete}
              />
              <ConfirmModal
                visible={isBackConfirmVisible}
                title="정말로 뒤로 가시겠어요?"
                message={"베스트샷 추천이 초기화됩니다.\n작성 중인 일기도 사라져요."}
                onCancel={() => setIsBackConfirmVisible(false)}
                onConfirm={async () => {
                  setIsBackConfirmVisible(false);
                  try {
                    await clearAllTempPhotos(token);
                  } catch (e) {
                    console.error("❌ 임시사진 삭제 실패:", e);
                  } finally {
                    resetDiary();
                    resetPhoto();
                    setMode("bestshot");
                    nav.push("/customGallery");
                  }
                }}
                cancelText="취소"
                confirmText="뒤로가기"
              />
            </View>
          </ScrollView>
          {isSaving && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>저장 중...</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
    flex: 1
  },
  middle: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  characterPicker: {
    paddingBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 30
  },
  low: {
    paddingHorizontal: 30,
    flex: 1,
    marginBottom: 30
  },
  scrollContainer: {
    flexGrow: 1
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "#D68089",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10
  }
});
