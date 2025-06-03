import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { usePhoto } from "../contexts/PhotoContext";
import CharacterPickerOverlay from "../components/CharacterPickerOverlay";
import EditImageSlider from "../components/EditImageSlider";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";
import ConfirmModal from "../components/Modal/ConfirmModal";

const API_BASE_URL = Constants?.expoConfig?.extra?.BACKEND_URL;

export default function EditPage() {
  const { token } = useAuth();
  const nav = useRouter();
  const {
    text,
    setText,
    selectedCharacter,
    setSelectedCharacter,
    selectedDate,
    diaryId,
    resetDiary
  } = useDiary();

  const {
    photoList: photos,
    setPhotoList,
    setTempPhotoList,
    mainPhotoId,
    setMainPhotoId,
    setSelected,
    resetPhoto,
    setMode,
    photoCount,
    setPhotoCount
  } = usePhoto();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhotoCount(photos.length);
    console.log("📸 사진 목록 업데이트:", photos.length);
  }, [photos]);

  const API_URL =
    Constants?.manifest?.extra?.BACKEND_URL || Constants?.expoConfig?.extra?.BACKEND_URL;
  console.log("📡 최종 API_URL:", API_URL);

  const formatDateToYMD = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const payload = {
    diaryDate: formatDateToYMD(selectedDate),
    content: text,
    emotionIcon: selectedCharacter?.name,
    photoIds: photos.map((p) => Number(p.id)),
    representativePhotoId: Number(mainPhotoId)
  };

  console.log("📦 PATCH 요청 body:", JSON.stringify(payload, null, 2));

  const photosToRender = [...photos];
  if (photosToRender.length < 9) {
    photosToRender.push({ id: "add", type: "add" });
  }
  const confirmDeletePhoto = (photoId) => {
    setPhotoToDelete(photoId);
    setConfirmVisible(true);
  };

  const handleDeleteConfirmed = () => {
    if (photoToDelete) {
      const updated = photos.filter((p) => p.id !== photoToDelete);
      setPhotoList(updated);
      setTempPhotoList(updated);
      setPhotoCount(updated.length);
      console.log("📸 사진 삭제 완료:", updated.length);

      if (String(photoToDelete) === String(mainPhotoId)) {
        setMainPhotoId(updated.length > 0 ? String(updated[0].id) : null);
      }

      setSelected((prev) => prev.filter((id) => String(id) !== String(photoToDelete)));
    }

    setConfirmVisible(false);
    setPhotoToDelete(null);
  };

  const handleSave = async () => {
    if (!token) {
      console.warn("❌ 저장 실패: 토큰이 없습니다.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/diaries/${diaryId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          diaryDate: formatDateToYMD(selectedDate),
          content: text,
          emotionIcon: selectedCharacter?.name,
          photoIds: photos.map((p) => Number(p.id)),
          representativePhotoId: Number(mainPhotoId)
        })
      });

      const resText = await response.text();
      console.log("📨 응답 상태:", response.status);
      console.log("📨 응답 본문:", resText);

      if (!response.ok) {
        console.error("❌ 저장 실패:", resText);
        return;
      }

      resetPhoto();
      resetDiary();
      nav.back();
    } catch (err) {
      console.error("💥 저장 중 에러:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhoto = () => {
    setMode("add");

    nav.push({
      pathname: "/customGallery",
      params: { mode: "add" }
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <HeaderDate
          date={selectedDate}
          onBack={() => nav.back()}
          hasText={text.trim().length > 0}
          onSave={handleSave}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <EditImageSlider
            photos={photosToRender}
            mainPhotoId={mainPhotoId}
            setMainPhotoId={setMainPhotoId}
            onDeletePhoto={confirmDeletePhoto}
            onAddPhoto={handleAddPhoto}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />

          <View style={styles.characterRow}>
            <View style={{ width: 64 }} />
            <IconButton
              source={selectedCharacter.source}
              wsize={42}
              hsize={40}
              onPress={() => setIsPickerVisible(!isPickerVisible)}
            />
            <View style={styles.rightButtons}>
              <IconButton
                source={require("../assets/icons/aipencilicon.png")}
                wsize={24}
                hsize={24}
                onPress={() =>
                  nav.push({
                    pathname: "/editWithAi",
                    params: {
                      date: selectedDate.toISOString().split("T")[0]
                    }
                  })
                }
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={28}
                hsize={24}
                onPress={() => nav.push("/photoReorder")}
              />
            </View>
          </View>

          <View style={styles.textBoxWrapper}>
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
              visible={confirmVisible}
              title="사진 삭제"
              message="정말 이 사진을 삭제하시겠어요?"
              onCancel={() => {
                setConfirmVisible(false);
                setPhotoToDelete(null);
              }}
              onConfirm={handleDeleteConfirmed}
              cancelText="취소"
              confirmText="삭제"
            />
          </View>
        </ScrollView>
        {isSaving && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#D68089" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FCF9F4",
    flex: 1
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20
  },
  characterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    paddingBottom: 10
  },
  rightButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  textBoxWrapper: {
    paddingHorizontal: 30,
    flex: 1
  }
});
