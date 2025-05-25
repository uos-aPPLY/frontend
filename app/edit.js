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
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";
import EditImageSlider from "../components/EditImageSlider";
import { usePhoto } from "../contexts/PhotoContext";
import CharacterPickerOverlay from "../components/CharacterPickerOverlay";

const screenWidth = Dimensions.get("window").width;

export default function EditPage() {
  const { token } = useAuth();
  const nav = useRouter();
  const { id } = useLocalSearchParams(); // diaryId

  const [diary, setDiary] = useState(null);
  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characterList[0]);
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mainPhotoId, setMainPhotoId } = usePhoto();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const fetchDiary = async () => {
    try {
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setDiary(data);
      setText(data.content);
      setSelectedCharacter(
        characterList.find((c) => c.name === data.emotionIcon) ||
          characterList[0]
      );
      setPhotos(data.photos || []);
    } catch (err) {
      console.error("❌ 일기 불러오기 실패:", err);
    }
  };

  const handleSave = async () => {
    const payload = {
      content: text,
      emotionIcon: selectedCharacter.name,
      photoIds: photos.map((p) => Number(p.id)),
      representativePhotoId: Number(mainPhotoId),
    };

    try {
      const res = await fetch(
        `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/${id}`,
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

  const handleDeletePhoto = (id) => {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    if (String(id) === String(mainPhotoId)) {
      setMainPhotoId(updated.length > 0 ? String(updated[0].id) : null);
    }
  };

  const handleAddPhoto = () => {
    console.log("사진 추가는 아직 미구현입니다.");
  };

  useEffect(() => {
    if (id && token) fetchDiary();
  }, [id, token]);

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
            photos={[...photos]}
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
              wsize={40}
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
                      date: diary.diaryDate, // 예: "2025-05-20"
                    },
                  })
                } // 원하는 기능으로 연결
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
