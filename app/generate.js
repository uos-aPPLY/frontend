import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import IconButton from "../components/IconButton";

export default function GeneratePage() {
  const nav = useRouter();
  const { photos = [] } = useLocalSearchParams();
  const [keywords, setKeywords] = useState([
    "#인물",
    "#사물",
    "#음식",
    "#동물",
    "#풍경",
  ]);

  const handleAddKeyword = () => {
    // 키워드 추가 로직
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          onPress={() => nav.back()}
        />
        <Text style={styles.title}>포커스 키워드 & 순서 설정</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* 설명 텍스트 */}
      <Text style={styles.subtitle}>
        AI 일기 생성 퀄리티를 위해 각 사진의 포커스를 지정해주세요!
      </Text>

      {/* 대표 이미지 */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: photos[0] }} style={styles.image} />
        <Text style={styles.label}>대표 사진</Text>
      </View>

      {/* 키워드 선택 */}
      <View style={styles.keywordContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {keywords.map((kw, index) => (
            <View key={index} style={styles.keywordTag}>
              <Text style={styles.keywordText}>{kw}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addKeyword}
            onPress={handleAddKeyword}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 다음 버튼 */}
      <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: "#a78c7b",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#7a6d63",
    marginBottom: 16,
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 16,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: "#D68089",
    fontWeight: "bold",
  },
  keywordContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  keywordTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  keywordText: {
    fontSize: 13,
    color: "#3f3f3f",
  },
  addKeyword: {
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E1A4A9",
  },
  addText: {
    color: "#fff",
    fontSize: 18,
  },
  nextButton: {
    backgroundColor: "#D9A2A8",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  nextText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
