import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useDiary } from "../contexts/DiaryContext";
import { usePhoto } from "../contexts/PhotoContext";

const DebugDiaryState = () => {
  const { text, selectedCharacter, selectedDate, diaryId, diaryMapById } =
    useDiary();
  const { photoList, mainPhotoId } = usePhoto();

  return (
    <View style={styles.debugBox}>
      <Text style={styles.debugTitle}>🧪 전역 상태 디버그</Text>
      <Text style={styles.debugText}>📝 text: {JSON.stringify(text)}</Text>
      <Text style={styles.debugText}>
        🎭 selectedCharacter: {JSON.stringify(selectedCharacter?.name)}
      </Text>
      <Text style={styles.debugText}>
        📅 selectedDate: {selectedDate?.toISOString?.()}
      </Text>
      <Text style={styles.debugText}>
        📓 diaryId: {JSON.stringify(diaryId)}
      </Text>
      <Text style={styles.debugText}>
        📚 diaryMapById keys: {Object.keys(diaryMapById).join(", ")}
      </Text>
      <Text style={styles.debugText}>📸 photoList: {photoList.length}장</Text>
      <Text style={styles.debugText}>
        🌟 mainPhotoId: {JSON.stringify(mainPhotoId)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  debugBox: {
    backgroundColor: "#eee",
    padding: 10,
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  debugTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  debugText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
});

export default DebugDiaryState;
