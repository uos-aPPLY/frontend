// app/albums/[albumId].js
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
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parse, format } from "date-fns";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function AlbumDiaryList() {
  const router = useRouter();
  const { albumId, name } = useLocalSearchParams();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = name ?? (albumId === "favorite" ? "좋아요" : "앨범 일기");

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const url =
          albumId === "favorite"
            ? `${BACKEND_URL}/api/albums/favorites`
            : `${BACKEND_URL}/api/albums/${albumId}/diaries`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setDiaries(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [albumId]);

  const goBack = () => router.replace("/profile");

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
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
              <Text style={styles.cardDate}>
                {format(
                  parse(item.diaryDate, "yyyy-MM-dd", new Date()),
                  "yyyy년 M월 d일 (E)"
                )}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>작성된 일기가 없습니다.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4", paddingTop: 26 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },
  headerContainer: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    position: "absolute",
    top: 80,
    left: 20,
    zIndex: 1,
  },
  backIcon: { width: 24, height: 24 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#A78C7B",
  },
  listContent: {
    marginTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
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
  imageWrapper: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: "hidden",
  },
  cardImage: { width: 120, height: 120, resizeMode: "cover" },
  cardTextContainer: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  cardContent: { fontSize: 16, color: "#A78C7B", lineHeight: 22 },
  cardDate: { fontSize: 14, color: "#C7C7CC", textAlign: "right" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
});
