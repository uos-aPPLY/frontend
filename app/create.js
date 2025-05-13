import { useState, useEffect, use } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  onPress,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";

import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadPhotos } from "../utils/uploadPhotos";
import { formatGridData } from "../utils/formatGridData";
import { clearAllTempPhotos } from "../utils/clearTempPhotos";

export default function CreatePage() {
  const nav = useRouter();
  const params = useLocalSearchParams();
  const from = params.from || "calendar";
  const {
    text,
    setText,
    selectedCharacter,
    setSelectedCharacter,
    selectedDate,
    setSelectedDate,
  } = useDiary();
  const date = selectedDate.toISOString().split("T")[0];
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { token } = useAuth();
  console.log("토큰:", token);

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("갤러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 160,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      if (!token) {
        console.error("토큰이 없습니다. 로그인 후 다시 시도하세요.");
        return;
      }
      try {
        const originalAssets = result.assets;

        const resizedAssets = await Promise.all(
          originalAssets.map((asset) =>
            ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 400 } }],
              {
                compress: 0.5,
                format: ImageManipulator.SaveFormat.JPEG,
              }
            )
          )
        );

        await uploadPhotos(resizedAssets, token, originalAssets);
        nav.push("/confirmPhoto");
      } catch (error) {
        console.error("업로드 실패", error);
      }
    }
  };

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
            setSelectedCharacter(require("../assets/character/char1.png"));
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
                  onPress={openGallery}
                />
              </View>
            </View>

            <View style={styles.characterPicker}>
              <IconButton
                source={selectedCharacter}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
            </View>

            <View style={styles.low}>
              {isPickerVisible ? (
                <View style={styles.overlay}>
                  {formatGridData(characterList, 3).map((char, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (char) {
                          setSelectedCharacter(char);
                          setIsPickerVisible(false);
                        }
                      }}
                      disabled={!char}
                    >
                      {char ? (
                        <Image source={char} style={styles.characterIcon} />
                      ) : (
                        <View style={[styles.characterIcon, { opacity: 0 }]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
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
    shadowOpacity: 0.1,
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
  overlay: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  characterIcon: {
    width: 64,
    height: 62,
    margin: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
