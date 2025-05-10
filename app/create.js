import React, { useState } from "react";
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

import HeaderDate from "../components/HeaderDate";
import CardPicture from "../components/CardPicture";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadPhotos } from "../utils/uploadPhotos";

export default function PhotoPage() {
  const nav = useRouter();
  const params = useLocalSearchParams();
  const date = params.date || new Date().toISOString().slice(0, 10);
  const { text, setText, selectedCharacter, setSelectedCharacter } = useDiary();
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
    });

    if (!result.canceled) {
      if (!token) {
        console.error("토큰이 없습니다. 로그인 후 다시 시도하세요.");
        return;
      }
      try {
        await uploadPhotos(result.assets, token);
        nav.push("/confirmPhoto");
      } catch (error) {
        console.error("업로드 실패", error);
      }
    }
  };

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
            nav.push("./(tabs)/calendar");
          }}
          hasText={text.trim().length > 0}
        />
        <View style={styles.middle}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <CardPicture isPlaceholder onPress={openGallery} />

            <View style={styles.characterPicker}>
              <IconButton
                source={selectedCharacter}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
            </View>

            <View style={[styles.low, { marginBottom: 50 }]}>
              {isPickerVisible ? (
                <View style={styles.overlay}>
                  {characterList.map((char, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedCharacter(char);
                        setIsPickerVisible(false);
                      }}
                    >
                      <Image source={char} style={styles.characterIcon} />
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
  },
  overlay: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  characterIcon: {
    width: 64,
    height: 62,
    margin: 15,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
