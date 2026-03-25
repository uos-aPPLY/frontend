import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  DeviceEventEmitter
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect } from "react";
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
import { openGalleryAndAdd } from "../utils/openGalleryAndAdd";

export default function EditPage() {
  const { token } = useAuth();
  const nav = useRouter();
  const navigation = useNavigation();
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
    setPhotoCount
  } = usePhoto();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    setTempPhotoList(null);
    const realPhotos = photos.filter((p) => p.type !== "add");
    setPhotoCount(realPhotos.length);

    console.log("📸 현재 사진 개수:", realPhotos.length);
    console.log("📸 현재 대표 사진 ID:", mainPhotoId);

    if (realPhotos.length === 0) {
      setMainPhotoId(null);
      console.log("📸 대표 사진이 없어 null로 초기화됨");
    } else if (mainPhotoId == null) {
      setMainPhotoId(String(realPhotos[0].id));
      console.log("✅ 대표 사진 자동 지정됨:", realPhotos[0].id);
    }
  }, [photos]);

  const API_URL =
    Constants?.manifest?.extra?.BACKEND_URL || Constants?.expoConfig?.extra?.BACKEND_URL;
  console.log("📡 최종 API_URL:", API_URL);

  const formatDateToYMD = (date) => {
    const local = new Date(date);
    local.setHours(local.getHours() + 9); // ✅ UTC+9 보정 (KST 기준)
    return local.toISOString().split("T")[0];
  };
  const date = formatDateToYMD(selectedDate);
  console.log("📅 선택된 날짜:", date);

  const payload = {
    diaryDate: date,
    content: text,
    emotionIcon: selectedCharacter?.name,
    photoIds: photos.filter((p) => p.type !== "add" && typeof p.id === "number").map((p) => p.id),
    representativePhotoId:
      typeof mainPhotoId === "string" && !isNaN(Number(mainPhotoId)) ? Number(mainPhotoId) : null
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

      if (String(photoToDelete) === String(mainPhotoId) || updated.length === 0) {
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
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      console.log("📨 응답 상태:", response.status);
      console.log("📨 응답 본문:", resText);

      if (!response.ok) {
        console.error("❌ 저장 실패:", resText);
        return;
      }

      DeviceEventEmitter.emit("refreshCalendar");
      resetPhoto();
      resetDiary();

      if (nav.canGoBack()) {
        nav.back();
        return;
      }

      nav.replace({ pathname: "/diary/[date]", params: { date } });
    } catch (err) {
      console.error("💥 저장 중 에러:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    const existingCount = photos.filter((p) => p.type !== "add").length;

    const addedAssets = await openGalleryAndAdd(token, existingCount);
    if (!addedAssets || addedAssets.length === 0) return;

    const newPhotos = addedAssets.map((asset) => ({
      id: asset.id,
      photoUrl: asset.photoUrl
    }));

    const updatedPhotos = [...photos.filter((p) => p.id && p.id !== "add"), ...newPhotos];

    setPhotoList(updatedPhotos);
    setTempPhotoList(updatedPhotos);

    if (!mainPhotoId || !updatedPhotos.some((p) => String(p.id) === String(mainPhotoId))) {
      setMainPhotoId(String(newPhotos[0].id));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <HeaderDate
          date={date}
          onBack={() => {
            resetDiary();
            resetPhoto();

            if (nav.canGoBack()) {
              nav.back();
              return;
            }

            nav.replace({ pathname: "/diary/[date]", params: { date } });
          }}
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
                onPress={
                  photos.filter((p) => p.type !== "add").length === 0
                    ? null
                    : () =>
                        nav.push({
                          pathname: "/editWithAi",
                          params: {
                            date: date
                          }
                        })
                }
                style={{
                  opacity: photos.filter((p) => p.type !== "add").length === 0 ? 0.3 : 1
                }}
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={28}
                hsize={24}
                onPress={photos.length === 0 ? null : () => nav.push("/photoReorder")}
                style={{ opacity: photos.length <= 1 ? 0.3 : 1 }}
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
