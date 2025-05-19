// app/create.js
import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import { format } from "date-fns";

import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadPhotos } from "../utils/uploadPhotos";
import { clearAllTempPhotos } from "../utils/clearTempPhotos";
import { openGalleryAndUpload } from "../utils/openGalleryAndUpload";
import CharacterPickerOverlay from "../components/CharacterPickerOverlay";
import Constants from "expo-constants";

export default function CreatePage() {
  const nav = useRouter();
  const { date: dateParam, from = "calendar" } = useLocalSearchParams();
  const {
    text,
    setText,
    selectedCharacter,
    setSelectedCharacter,
    selectedDate,
    setSelectedDate,
  } = useDiary();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { resetDiary } = useDiary();
  const { BACKEND_URL } = Constants.expoConfig.extra;

  const createDiary = async () => {
    try {
      const payload = {
        diaryDate: date,
        content: text,
        emotionIcon: selectedCharacter.name,
        photoIds: null, // ✅ 사진 없음
        representativePhotoId: null, // ✅ 대표 사진 없음
      };

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
        console.error("❌ 일기 저장 실패:", result);
        return;
      }

      console.log("✅ 저장 성공:", result);
      resetDiary(); // 상태 초기화
      nav.push("/calendar");
    } catch (err) {
      console.error("❌ 저장 중 에러:", err);
    }
  };

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(new Date(dateParam)); // 📌 이거 추가!
    }
  }, [dateParam]);

  let date = "";

  if (selectedDate instanceof Date && !isNaN(selectedDate)) {
    date = selectedDate.toISOString().split("T")[0];
  } else if (typeof selectedDate === "string") {
    date = selectedDate; // 이미 yyyy-MM-dd 일 수도 있음
  } else {
    date = ""; // fallback
  }

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      clearAllTempPhotos(token);
    }
  }, [token]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      style={{ flex: 1 }}
    >
      <View style={styles.all}>
        <HeaderDate
          date={date}
          onBack={() => {
            resetDiary();
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
            <View style={styles.shadowWrapper}>
              <View style={styles.card}>
                <IconButton
                  source={require("../assets/icons/bigpinkplusicon.png")}
                  wsize={50}
                  hsize={50}
                  onPress={() => openGalleryAndUpload(token, nav.push)}
                />
              </View>
            </View>

            <View style={styles.characterRow}>
              <View style={{ width: 24 }} />
              <IconButton
                source={selectedCharacter.source}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
              <View style={{ width: 24 }} />
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
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
    paddingHorizontal: 30,
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
  middle: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 20,
  },
  characterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    padding: 10,
  },

  low: {
    paddingHorizontal: 30,
    flex: 1,
    marginBottom: 40,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
