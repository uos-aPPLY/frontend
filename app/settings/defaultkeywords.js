import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function DefaultKeywordsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [keywords, setKeywords] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setKeywords(json);
    } catch (err) {
      console.error("❌ 키워드 로딩 실패:", err);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/keywords`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyword.trim() }),
      });

      const newItem = await res.json();
      if (!res.ok) throw new Error("추가 실패");

      setKeywords((prev) => [...prev, newItem]); // ⬅️ 뒤에 추가
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
          Authorization: `Bearer ${token}`,
        },
      });
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("❌ 키워드 삭제 실패:", err);
    }
  };

  return (
    <View style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={require("../../assets/icons/backicon.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>키워드 설정</Text>
        </View>

        <TouchableOpacity onPress={() => setIsEditMode((prev) => !prev)}>
          <Text style={styles.editText}>{isEditMode ? "확인" : "수정"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        포커스 키워드 설정 시 기본 키워드로 제공돼요.
      </Text>

      {/* 키워드 목록 */}
      <ScrollView contentContainerStyle={styles.keywordList}>
        {keywords.map((item) => (
          <View key={item.id} style={styles.keywordWrapper}>
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
              onSubmitEditing={addKeyword}
              returnKeyType="done"
              placeholderTextColor="#aaa"
              textAlign="center"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 26,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 37,
    paddingTop: 63,
    paddingBottom: 10,
    backgroundColor: "#FCF9F4",
  },
  backIcon: {
    width: 12,
    height: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A78C7B",
    textAlign: "center",
    flex: 1,
  },
  editText: {
    fontSize: 16,
    color: "#A78C7B",
  },

  description: {
    fontSize: 12,
    textAlign: "center",
    color: "#B3A9A0",
    marginBottom: 15,
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 45,
    gap: 8,
    marginTop: 10,
  },
  keywordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8E6E3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  keywordText: {
    fontSize: 14,
    color: "#444",
  },
  removeIcon: {
    fontSize: 16,
    color: "#B76B6B",
    marginLeft: 6,
  },
  input: {
    fontSize: 14,
    color: "#333",
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 40,
    textAlign: "center",
  },
});
