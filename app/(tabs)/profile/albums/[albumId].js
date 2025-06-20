// app/albums/[albumId].js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parse, format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import HeaderSettings from "../../../../components/Header/HeaderSettings";

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
          headers: { Authorization: `Bearer ${token}` }
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

  const goBack = () => router.back();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D68089" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderSettings title={title} onBackPress={goBack} />

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/diary/${item.diaryDate}`)}
          >
            <View style={styles.imageWrapper}>
              {item.representativePhotoUrl ? (
                <Image source={{ uri: item.representativePhotoUrl }} style={styles.cardImage} />
              ) : (
                <LinearGradient
                  colors={["#dad4ec", "#dad4ec", "#f3e7e9"]}
                  locations={[0, 0.01, 1]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.dayStandardBackground}
                />
              )}
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardContent} numberOfLines={3}>
                {item.content}
              </Text>
              <Text style={styles.cardDate}>
                {format(parse(item.diaryDate, "yyyy-MM-dd", new Date()), "yyyy년 M월 d일 (E)")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => <Text style={styles.emptyText}>작성된 일기가 없습니다.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4"
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20
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
    overflow: "visible"
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: "hidden"
  },
  cardImage: { width: 120, height: 120, resizeMode: "cover" },
  cardTextContainer: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between"
  },
  cardContent: { fontSize: 16, color: "#A78C7B", lineHeight: 22 },
  cardDate: { fontSize: 14, color: "#C7C7CC", textAlign: "right" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999"
  },
  dayStandardBackground: {
    flex: 1
  }
});
