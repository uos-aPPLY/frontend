import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { usePhoto } from "../contexts/PhotoContext";
import CharacterPickerOverlay from "../components/CharacterPickerOverlay";
import EditImageSlider from "../components/EditImageSlider";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import { openGalleryAndAdd } from "../utils/openGalleryAndAdd";

const screenWidth = Dimensions.get("window").width;

export default function EditPage() {
  const { token } = useAuth();
  const nav = useRouter();
  const { id } = useLocalSearchParams(); // diaryId
  const { diaryMapById } = useDiary();
  const diary = diaryMapById?.[id];

  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characterList[0]);
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mainPhotoId, setMainPhotoId } = usePhoto();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (diary) {
      setText(diary.content);
      setSelectedCharacter(
        characterList.find((c) => c.name === diary.emotionIcon) ||
          characterList[0]
      );
      setPhotos(diary.photos || []);
    }
  }, [diary]);

  const photosToRender = [...photos];
  if (photosToRender.length < 9) {
    photosToRender.push({ id: "add", type: "add" });
  }

  const handleSave = async () => {
    const payload = {
      content: text,
      emotionIcon: selectedCharacter.name,
      photoIds: photos.map((p) => Number(p.id)),
      representativePhotoId: Number(mainPhotoId),
    };

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/diaries/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        console.error("❌ 수정 실패:", await res.json());
        return;
      }
      console.log("✅ 수정 성공");
      nav.replace({
        pathname: "/diary/[date]",
        params: { date: diary.diaryDate },
      });
    } catch (err) {
      console.error("❌ 저장 중 에러:", err);
    }
  };

  const handleDeletePhoto = (photoId) => {
    const updated = photos.filter((p) => p.id !== photoId);
    setPhotos(updated);
    if (String(photoId) === String(mainPhotoId)) {
      setMainPhotoId(updated.length > 0 ? String(updated[0].id) : null);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const addedAssets = await openGalleryAndAdd(token);
      if (!addedAssets || addedAssets.length === 0) return;

      const newPhotos = addedAssets.map((asset) => ({
        id: asset.id,
        photoUrl: asset.photoUrl,
      }));

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);

      if (
        !mainPhotoId ||
        !updatedPhotos.some((p) => String(p.id) === String(mainPhotoId))
      ) {
        setMainPhotoId(String(newPhotos[0].id));
      }

      console.log("📸 사진 추가 완료:", newPhotos.length, "장");
    } catch (err) {
      console.error("❌ 사진 추가 중 오류:", err);
    }
  };

  if (!diary) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <HeaderDate
          date={diary.diaryDate}
          onBack={() =>
            nav.replace({
              pathname: "/diary/[date]",
              params: { date: diary.diaryDate },
            })
          }
          hasText={text.trim().length > 0}
          onSave={handleSave}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <EditImageSlider
            photos={photosToRender}
            mainPhotoId={mainPhotoId}
            setMainPhotoId={setMainPhotoId}
            onDeletePhoto={handleDeletePhoto}
            onAddPhoto={handleAddPhoto}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />

          <View style={styles.characterRow}>
            <View style={{ width: 58 }} />
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
                    params: { date: diary.diaryDate },
                  })
                }
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={24}
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
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FCF9F4",
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  characterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    paddingBottom: 10,
  },
  rightButtons: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  textBoxWrapper: {
    paddingHorizontal: 30,
    flex: 1,
  },
});
