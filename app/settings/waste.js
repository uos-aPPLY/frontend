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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import CheckBox from "../../components/CheckBox";
import HeaderSettings from "../../components/Header/HeaderSettings";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function WastePage() {
  const router = useRouter();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setConfirmVisible(false);
    const token = await SecureStore.getItemAsync("accessToken");
    if (confirmAction === "delete") {
      if (selectedIds.size > 0) {
        await Promise.all(
          Array.from(selectedIds).map((id) =>
            fetch(`${BACKEND_URL}/api/diaries/trash/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      } else {
        await fetch(`${BACKEND_URL}/api/diaries/trash/all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } else if (confirmAction === "restore") {
      if (selectedIds.size > 0) {
        await Promise.all(
          Array.from(selectedIds).map((id) =>
            fetch(`${BACKEND_URL}/api/diaries/trash/${id}/restore`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      } else {
        await Promise.all(
          diaries.map((item) =>
            fetch(`${BACKEND_URL}/api/diaries/trash/${item.id}/restore`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }
    }
    setSelectionMode(false);
    setSelectedIds(new Set());
    fetchTrash();
  };

  const renderItem = ({ item }) => {
    const checked = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => (selectionMode ? toggleSelect(item.id) : null)}
        activeOpacity={selectionMode ? 0.6 : 1}
      >
        {selectionMode && (
          <CheckBox
            style={styles.checkbox}
            value={checked}
            onValueChange={() => toggleSelect(item.id)}
          />
        )}
        <View style={styles.imageWrapper}>
          {item.representativePhotoUrl ? (
            <Image
              source={{ uri: item.representativePhotoUrl }}
              style={styles.cardImage}
            />
          ) : (
            <LinearGradient
              colors={["#dad4ec", "#dad4ec", "#f3e7e9"]}
              locations={[0, 0.01, 1]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradientBackground}
            />
          )}
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardContent} numberOfLines={3}>
            {item.content}
          </Text>
          <Text style={styles.cardDate}>{item.diaryDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const rightHeaderTextComponent = (
    <TouchableOpacity
      onPress={() => {
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        } else {
          setSelectionMode(true);
        }
      }}
    >
      <Text style={styles.headerActionText}>
        {selectionMode ? "취소" : "선택"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ConfirmModal
        visible={confirmVisible}
        title={
          confirmAction === "delete"
            ? selectedIds.size > 0
              ? "선택한 일기를 삭제하시겠어요?"
              : "전체 일기를 삭제하시겠어요?"
            : "선택한 일기를 복원하시겠어요?"
        }
        message={
          confirmAction === "delete"
            ? "삭제 후에는 복구할 수 없어요."
            : "일기가 휴지통에서 복원됩니다."
        }
        cancelText="취소"
        confirmText={confirmAction === "delete" ? "삭제" : "복원"}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      <HeaderSettings
        title="휴지통"
        rightComponent={rightHeaderTextComponent}
      />

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
            <Text style={styles.footerText}>
              {selectedIds.size > 0 ? "삭제" : "전체 삭제"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              setConfirmAction("restore");
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.footerText}>
              {selectedIds.size > 0 ? "복구" : "전체 복구"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerActionText: {
    fontSize: 16,
    color: "#A78C7B",
    fontWeight: "600",
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFEFE",
    marginBottom: 18,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    overflow: "visible",
  },
  checkbox: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: "hidden",
  },
  gradientBackground: {
    flex: 1,
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
  footerButton: { padding: 10 },
  footerText: { fontSize: 16, color: "#A78C7B", fontWeight: "600" },
});
