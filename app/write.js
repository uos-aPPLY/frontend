import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, ScrollView, Text } from "react-native";
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

const MAX_PHOTO_COUNT = 9;

export default function WritePage() {
  const nav = useRouter();
  const { text, setText, selectedCharacter, setSelectedCharacter, selectedDate, resetDiary } =
    useDiary();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const {
    photoList,
    setPhotoList,
    setSelected,
    originalPhotoList,
    mainPhotoId,
    setMainPhotoId,
    resetPhoto,
    setSelectedAssets
  } = usePhoto();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [targetPhotoId, setTargetPhotoId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const date = selectedDate instanceof Date ? selectedDate.toISOString().split("T")[0] : "";

  useEffect(() => {
    setSelectedAssets([]);
  }, []);

  useEffect(() => {
    return () => {
      // 페이지 unmount 시 selected 초기화
      setSelected([]);
      setPhotoList(originalPhotoList); // 이전 사진 복원도 같이
    };
  }, []);

  const photosToRender = [...photoList];
  if (photosToRender.length < MAX_PHOTO_COUNT) {
    photosToRender.push({ id: "add", type: "add" });
  }

  const handleAddPhoto = async () => {
    const existingCount = photoList.filter((p) => p.id && p.id !== "add").length;
    const addedAssets = await openGalleryAndAdd(token, existingCount);
    if (!addedAssets || addedAssets.length === 0) return;

    const newPhotos = addedAssets.map((asset) => ({
      id: asset.id,
      photoUrl: asset.photoUrl
    }));

    const updated = [...photoList.filter((p) => p.id && p.id !== "add"), ...newPhotos];
    setPhotoList(updated);

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
      const updated = photoList.filter((p) => p.id !== targetPhotoId);
      setPhotoList(updated);

      if (String(targetPhotoId) === String(mainPhotoId)) {
        setMainPhotoId(updated.length > 0 ? String(updated[0].id) : null);
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

  const createDiary = async () => {
    setIsSaving(true);

    try {
      const payload = {
        diaryDate: date,
        content: text,
        emotionIcon: selectedCharacter.name,
        photoIds: photoList.filter((p) => p.id && p.id !== "add").map((p) => Number(p.id)),
        representativePhotoId: Number(mainPhotoId)
      };

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
        setIsSaving(false);
        return;
      }

      nav.push({ pathname: "/calendar", params: { date } });
    } catch (err) {
      console.error("❌ 일기 생성 중 에러:", err);
    } finally {
      setIsSaving(false);
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
            setPhotoList(originalPhotoList);
            setSelected([]);
            nav.back();
          }}
          hasText={text.trim().length > 0}
          onSave={() => {
            resetDiary();
            createDiary();
            resetPhoto();
            setSelected([]);
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
