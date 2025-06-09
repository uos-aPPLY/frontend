// app/(tabs)/profile/settings/defaultkeywords.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/Header/HeaderSettings";

export default function DefaultKeywordsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [keywords, setKeywords] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;
  const pageDescription = "포커스 키워드 설정 시 기본 키워드로 제공돼요.";

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      setKeywords(json);
    } catch (err) {
      console.error("❌ 키워드 로딩 실패:", err);
    }
  };

  const addKeyword = async () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    // 🔒 중복 방지
    if (keywords.some((k) => k.name === trimmed)) {
      setNewKeyword("");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: trimmed })
      });

      const newItem = await res.json();
      if (!res.ok) throw new Error("추가 실패");

      setKeywords((prev) => [...prev, newItem]);
      setNewKeyword("");
    } catch (err) {
      console.error("❌ 키워드 추가 실패:", err);
    }
  };

  const deleteKeyword = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/keywords/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("❌ 키워드 삭제 실패:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="키워드 설정"
        descriptionText={pageDescription}
        rightComponent={
          <TouchableOpacity onPress={() => setIsEditMode((prev) => !prev)}>
            <Text style={styles.headerEditText}>{isEditMode ? "확인" : "수정"}</Text>
          </TouchableOpacity>
        }
      />

      {/* 키워드 목록 */}
      <ScrollView contentContainerStyle={styles.keywordList}>
        {keywords.map((item, index) => (
          <View key={`${item.id || item.name}-${index}`} style={styles.keywordWrapper}>
            <Text style={styles.keywordText}>#{item.name}</Text>
            {isEditMode && (
              <TouchableOpacity onPress={() => deleteKeyword(item.id)}>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* 추가 인풋 */}
        {isEditMode && (
          <View style={styles.keywordWrapper}>
            <Text style={styles.keywordText}>#</Text>
            <TextInput
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="추가"
              style={styles.input}
              onBlur={addKeyword}
              returnKeyType="done"
              placeholderTextColor="#aaa"
              textAlign="center"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  headerEditText: {
    fontSize: 16,
    color: "#A78C7B"
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 45,
    gap: 8
  },
  keywordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8E6E3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  keywordText: {
    fontSize: 14,
    color: "#444"
  },
  removeIcon: {
    fontSize: 16,
    color: "#B76B6B",
    marginLeft: 6
  },
  input: {
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 4,
    minWidth: 40,
    textAlign: "center"
  }
});
