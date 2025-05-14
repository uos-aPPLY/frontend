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
  Text,
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
  } = useDiary();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);
  const { photoList, setPhotoList, mainPhotoId, setMainPhotoId } = usePhoto();
  const photosToShow = photoList.length > 0 ? photoList : tempPhotos;
  const date =
    selectedDate instanceof Date
      ? selectedDate.toISOString().split("T")[0]
      : "";

  const [currentIndex, setCurrentIndex] = useState(0);

  const photosToRender = [...photosToShow];
  if (photosToRender.length < MAX_PHOTO_COUNT) {
    photosToRender.push({ id: "add", type: "add" }); // 가상 항목
  }
  const handleAddPhoto = async () => {
    const addedAssets = await openGalleryAndAdd(token);
    if (!addedAssets || addedAssets.length === 0) return;

    const newPhotos = addedAssets.map((asset) => ({
      id: asset.id,
      photoUrl: asset.photoUrl,
    }));

    const updated = [...photosToShow, ...newPhotos];

    if (photoList.length > 0) {
      setPhotoList(updated);
    } else {
      setTempPhotos(updated);
    }
  };

  const handleHidePhoto = async (id) => {
    try {
      await deletePhotoById(id, token); // 서버에서 삭제
      // 상태에서 해당 사진 제거
      const updated = photosToShow.filter((p) => p.id !== id);
      if (photoList.length > 0) {
        setPhotoList(updated);
      } else {
        setTempPhotos(updated);
      }

      // 대표 사진이 삭제된 경우
      if (String(id) === String(mainPhotoId)) {
        if (updated.length > 0) {
          setMainPhotoId(String(updated[0].id));
          console.log("📸 대표 사진 삭제됨 → 새 대표:", updated[0].id);
        } else {
          setMainPhotoId(null); // 사진이 아예 없어진 경우
          console.log("📸 모든 사진 삭제됨 → 대표 사진 없음");
        }
      }

      // 현재 인덱스 범위 벗어났다면 조정
      if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length - 1);
      }
    } catch (err) {
      console.error("❌ 사진 삭제 중 오류:", err);
    }
  };

  useEffect(() => {
    const fetchTempPhotos = async () => {
      try {
        console.log("📡 fetchTempPhotos 호출됨");
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("📷 fetchTempPhotos 결과:", data);
        console.log("🧪 현재 대표 사진 상태:", mainPhotoId, typeof mainPhotoId);

        setTempPhotos(data);

        if (
          data.length > 0 &&
          (!mainPhotoId ||
            !data.some((p) => String(p.id) === String(mainPhotoId)))
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
    try {
      const payload = {
        diaryDate: date,
        content: text,
        emotionIcon: selectedCharacter.name, // 또는 selectedCharacter.icon 등
        photoIds: photosToShow
          .filter((p) => p.id && p.id !== "add")
          .map((p) => Number(p.id)),
        representativePhotoId: Number(mainPhotoId),
      };

      console.log("📝 일기 생성 요청 페이로드:", payload);

      const res = await fetch(`${BACKEND_URL}/api/diaries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("❌ 일기 생성 실패:", result);
        return;
      }

      console.log("✅ 일기 생성 성공:", result);
      nav.push("/calendar");
    } catch (err) {
      console.error("❌ 일기 생성 중 에러:", err);
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
            setText("");
            setSelectedCharacter(characterList[0]);
            setSelectedDate(null);
            nav.push("/calendar");
          }}
          hasText={text.trim().length > 0}
          onSave={createDiary}
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
              <View style={{ width: 24, height: 24 }} />
              <IconButton
                source={selectedCharacter.source}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={24}
                hsize={24}
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
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
    flex: 1,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 22,
    marginTop: 5,
  },

  indicatorItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
  },

  thumbnailImage: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },

  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
  },
  cardContainer: {
    position: "relative",
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 30,
  },

  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    zIndex: 10,
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
  addCard: {
    marginTop: 10,
    width: screenWidth - 60,
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  middle: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 15,
  },
  characterPicker: {
    paddingBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 35,
  },
  low: {
    paddingHorizontal: 30,
    flex: 1,
    marginBottom: 30,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
