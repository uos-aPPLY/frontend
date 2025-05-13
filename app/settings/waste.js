// app/settings/waste.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import Checkbox from "expo-checkbox";
import ConfirmModal from "../../components/Modal/ConfirmModal";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function WastePage() {
  const router = useRouter();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' or 'restore'

  // Fetch trash diaries
  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`${BACKEND_URL}/api/diaries/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setDiaries(json.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  // Toggle selection of a diary
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Confirm and perform action
  const handleConfirm = async () => {
    setConfirmVisible(false);
    const token = await SecureStore.getItemAsync("accessToken");
    if (confirmAction === "delete") {
      if (selectedIds.size === 0) return;
      try {
        await fetch(`${BACKEND_URL}/api/diaries/trash/all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error(e);
      }
    } else if (confirmAction === "restore") {
      // Restore each selected
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`${BACKEND_URL}/api/diaries/trash/${id}/restore`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
    }
    // Reset state and refresh list
    setSelectionMode(false);
    setSelectedIds(new Set());
    fetchTrash();
  };

  // Render card
  const renderItem = ({ item }) => {
    const checked = selectedIds.has(item.id);
    return (
      <Pressable
        style={styles.card}
        onPress={() => (selectionMode ? toggleSelect(item.id) : null)}
        activeOpacity={selectionMode ? 0.6 : 1}
      >
        {selectionMode && (
          <Checkbox
            style={styles.checkbox}
            value={checked}
            onValueChange={() => toggleSelect(item.id)}
          />
        )}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.representativePhotoUrl }}
            style={styles.cardImage}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardContent} numberOfLines={3}>
            {item.content}
          </Text>
          <Text style={styles.cardDate}>{item.diaryDate}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ConfirmModal
        visible={confirmVisible}
        title={
          confirmAction === "delete"
            ? "선택한 일기를 영구 삭제하시겠어요?"
            : "선택한 일기를 복원하시겠어요?"
        }
        message={
          confirmAction === "delete"
            ? "삭제된 일기는 복구할 수 없습니다."
            : "일기가 휴지통에서 복원됩니다."
        }
        cancelText="취소"
        confirmText={confirmAction === "delete" ? "삭제" : "복원"}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
        />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>휴지통</Text>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => {
            if (selectionMode) {
              setSelectionMode(false);
              setSelectedIds(new Set());
            } else {
              setSelectionMode(true);
            }
          }}
        >
          <Text style={styles.headerAction}>
            {selectionMode ? "취소" : "선택"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>휴지통이 비어있습니다.</Text>
        )}
      />

      {selectionMode && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              setConfirmAction("delete");
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.footerText}>전체 삭제</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              setConfirmAction("restore");
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.footerText}>전체 복구</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4", paddingTop: 26 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backButton: {
    position: "absolute",
    top: 80,
    left: 30,
    padding: 8,
    zIndex: 1,
  },
  backicon: { width: 12, height: 22 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#A78C7B" },
  headerAction: { fontSize: 16, color: "#A78C7B", fontWeight: "600" },
  headerActionButton: {
    position: "absolute",
    right: 36,
  },
  listContent: { padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFEFE",
    marginBottom: 18,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    overflow: "hidden",
    position: "relative",
  },
  checkbox: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 18,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  cardTextContainer: { flex: 1, padding: 18, justifyContent: "space-between" },
  cardContent: { fontSize: 16, color: "#A78C7B", lineHeight: 22 },
  cardDate: { fontSize: 14, color: "#C7C7CC", textAlign: "right" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 60,
  },
  footerButton: { padding: 12 },
  footerText: { fontSize: 16, color: "#A78C7B", fontWeight: "600" },
});
