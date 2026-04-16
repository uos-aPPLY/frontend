import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import HeaderDate from "../../components/Header/HeaderDate";
import IconButton from "../../components/common/IconButton";
import TextBox from "../../components/common/TextBox";
import characterList from "../../assets/characterList";
import { usePhoto } from "../../contexts/PhotoContext";
import CharacterPickerOverlay from "../../components/CharacterPickerOverlay";
import EditImageSlider from "../../components/photo/EditImageSlider";
import { useDiary } from "../../contexts/DiaryContext";
import { useAuth } from "../../contexts/AuthContext";
import Constants from "expo-constants";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { openGalleryAndAdd } from "../../utils/openGalleryAndAdd";

function buildEditSnapshot({ text, selectedCharacter, photos, mainPhotoId }) {
  return JSON.stringify({
    text,
    selectedCharacter: selectedCharacter?.name ?? "",
    mainPhotoId: mainPhotoId ? String(mainPhotoId) : "",
    photoIds: photos.filter((photo) => photo.type !== "add").map((photo) => String(photo.id))
  });
}

export default function EditPage() {
  const { token } = useAuth();
  const nav = useRouter();
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const textBoxOffsetRef = useRef(0);
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const initialSnapshotRef = useRef(null);
  const pendingActionRef = useRef(null);
  const skipBeforeRemoveRef = useRef(false);

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

  const currentSnapshot = useMemo(
    () =>
      buildEditSnapshot({
        text,
        selectedCharacter,
        photos,
        mainPhotoId
      }),
    [mainPhotoId, photos, selectedCharacter, text]
  );

  useEffect(() => {
    if (diaryId && initialSnapshotRef.current === null) {
      initialSnapshotRef.current = currentSnapshot;
    }
  }, [currentSnapshot, diaryId]);

  const hasUnsavedChanges =
    initialSnapshotRef.current !== null && initialSnapshotRef.current !== currentSnapshot;

  const photosToRender = [...photos];
  if (photosToRender.length < 9) {
    photosToRender.push({ id: "add", type: "add" });
  }
  const confirmDeletePhoto = (photoId) => {
    setPhotoToDelete(photoId);
    setConfirmVisible(true);
  };

  const leaveToDiary = useCallback(() => {
    skipBeforeRemoveRef.current = true;
    initialSnapshotRef.current = currentSnapshot;
    resetDiary();
    resetPhoto();
    setShowLeaveConfirm(false);

    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;

    if (pendingAction) {
      navigation.dispatch(pendingAction);
      return;
    }

    if (nav.canGoBack()) {
      nav.back();
      return;
    }

    nav.replace({ pathname: "/diary/[date]", params: { date } });
  }, [currentSnapshot, date, nav, navigation, resetDiary, resetPhoto]);

  const attemptLeave = useCallback(() => {
    if (!hasUnsavedChanges) {
      leaveToDiary();
      return;
    }

    setShowLeaveConfirm(true);
  }, [hasUnsavedChanges, leaveToDiary]);

  const scrollToTextBox = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, textBoxOffsetRef.current - 16),
          animated: true
        });
      }, 120);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      const actionType = event.data.action?.type;

      if (skipBeforeRemoveRef.current) {
        skipBeforeRemoveRef.current = false;
        return;
      }

      if (!["GO_BACK", "POP", "POP_TO_TOP"].includes(actionType)) {
        return;
      }

      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      pendingActionRef.current = event.data.action;
      setShowLeaveConfirm(true);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

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
      skipBeforeRemoveRef.current = true;
      initialSnapshotRef.current = currentSnapshot;
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

  const handleInlineReorder = useCallback(
    (reorderedPhotos) => {
      setPhotoList(reorderedPhotos);
      setTempPhotoList(reorderedPhotos);
      setSelected(reorderedPhotos.map((photo) => String(photo.id)));

      if (!reorderedPhotos.some((photo) => String(photo.id) === String(mainPhotoId))) {
        setMainPhotoId(reorderedPhotos[0] ? String(reorderedPhotos[0].id) : null);
      }
    },
    [mainPhotoId, setMainPhotoId, setPhotoList, setSelected, setTempPhotoList]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <HeaderDate
          date={date}
          onBack={attemptLeave}
          hasText={text.trim().length > 0}
          onSave={handleSave}
        />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <EditImageSlider
            photos={photosToRender}
            mainPhotoId={mainPhotoId}
            setMainPhotoId={setMainPhotoId}
            onDeletePhoto={confirmDeletePhoto}
            onAddPhoto={handleAddPhoto}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            enableInlineReorder
            onReorderPhotos={handleInlineReorder}
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
                source={require("../../assets/icons/aipencilicon.png")}
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
              <View style={styles.rightButtonSpacer} />
            </View>
          </View>

          <View
            style={styles.textBoxWrapper}
            onLayout={(event) => {
              textBoxOffsetRef.current = event.nativeEvent.layout.y;
            }}
          >
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
                  onFocus={scrollToTextBox}
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

            <ConfirmModal
              visible={showLeaveConfirm}
              title="변경사항을 저장하지 않을까요?"
              message="지금 나가면 수정 중인 내용이 반영되지 않습니다."
              onCancel={() => {
                pendingActionRef.current = null;
                setShowLeaveConfirm(false);
              }}
              onConfirm={leaveToDiary}
              cancelText="계속 수정"
              confirmText="나가기"
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
  rightButtonSpacer: {
    width: 28,
    height: 24
  },
  textBoxWrapper: {
    paddingHorizontal: 30,
    flex: 1
  }
});
