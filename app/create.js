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

  const date = selectedDate ? selectedDate.toISOString().split("T")[0] : ""; // 또는 디폴트 날짜 "2025-01-01" 등
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { token } = useAuth();
  const seoulNow = new Date(
    new Date().toLocaleString("sv", { timeZone: "Asia/Seoul" })
  );

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
            setText("");
            setSelectedCharacter(characterList[0]);
            setSelectedDate(null);
            nav.push("/calendar");
          }}
          hasText={text.trim().length > 0}
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

            <View style={styles.characterPicker}>
              <IconButton
                source={selectedCharacter.source}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
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
  characterPicker: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
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
