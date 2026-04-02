// app/albums/[albumId].js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { parse, format, isValid } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import HeaderSettings from "../../../../components/Header/HeaderSettings";
import { useAuth } from "../../../../contexts/AuthContext";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function AlbumDiaryList() {
  const router = useRouter();
  const { token } = useAuth();
  const { albumId, name } = useLocalSearchParams();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = name ?? (albumId === "favorite" ? "좋아요" : "앨범 일기");
  const parsedDates = diaries
    .map((item) => parse(item.diaryDate, "yyyy-MM-dd", new Date()))
    .filter((date) => isValid(date))
    .sort((left, right) => left - right);
  const albumSummary = {
    diaryCount: diaries.length,
    photoDiaryCount: diaries.filter((item) => !!item.representativePhotoUrl).length,
    period:
      parsedDates.length > 0
        ? `${format(parsedDates[0], "yyyy년 M월 d일")} - ${format(
            parsedDates[parsedDates.length - 1],
            "yyyy년 M월 d일"
          )}`
        : "아직 기록이 없어요.",
    guideText:
      albumId === "favorite"
        ? "좋아요 일기를 한곳에 모아 빠르게 다시 볼 수 있어요."
        : "같은 위치로 묶인 일기를 기간순으로 정리해 보여줘요."
  };

  const fetchAlbumDiaries = useCallback(async () => {
    try {
      if (!token) return;
      const url =
        albumId === "favorite"
          ? `${BACKEND_URL}/api/albums/favorites`
          : `${BACKEND_URL}/api/albums/${albumId}/diaries`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setDiaries(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [albumId, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    fetchAlbumDiaries();
  }, [fetchAlbumDiaries, token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        return;
      }

      fetchAlbumDiaries();
    }, [fetchAlbumDiaries, token])
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("favoriteChanged", () => {
      fetchAlbumDiaries();
    });

    return () => subscription.remove();
  }, [fetchAlbumDiaries]);

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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{albumSummary.guideText}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>일기 수</Text>
            <Text style={styles.summaryChipValue}>{albumSummary.diaryCount}개</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>사진 포함</Text>
            <Text style={styles.summaryChipValue}>{albumSummary.photoDiaryCount}개</Text>
          </View>
        </View>
        <Text style={styles.summaryPeriod}>{albumSummary.period}</Text>
      </View>

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/diary/[date]",
                params: { date: item.diaryDate, from: "album" }
              })
            }
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
  summaryCard: {
    backgroundColor: "#FFF8F4",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  summaryTitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#8D6F60",
    fontWeight: "600"
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  summaryChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  summaryChipLabel: {
    fontSize: 12,
    color: "#B09587"
  },
  summaryChipValue: {
    marginTop: 4,
    fontSize: 15,
    color: "#7E6458",
    fontWeight: "700"
  },
  summaryPeriod: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "#A78C7B"
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
