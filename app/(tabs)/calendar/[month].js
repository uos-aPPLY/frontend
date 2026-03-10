// app/(tabs)/calendar/[month].js
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
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HeaderSettings from "../../../components/Header/HeaderSettings";
import * as Localization from "expo-localization";
import { utcToZonedTime } from "date-fns-tz";
import { ko, enUS } from "date-fns/locale";
import { parse, format, getYear, getMonth } from "date-fns";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function DiaryList() {
  const router = useRouter();
  const { month } = useLocalSearchParams();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeZone = Localization.timezone;
  const locale = Localization.locale.startsWith("ko") ? ko : enUS;

  const monthDate = React.useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }, [month]);

  const displayMonth = React.useMemo(() => format(monthDate, "yyyy년 M월"), [monthDate]);

  const goBack = () => {
    router.back();
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync("accessToken");
        const year = getYear(monthDate);
        const monthParam = getMonth(monthDate) + 1;

        const response = await fetch(
          `${BACKEND_URL}/api/diaries/calendar?year=${year}&month=${monthParam}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const json = await response.json();
        if (response.ok) {
          setDiaries(json);
        } else {
          console.error("Failed to fetch diaries:", json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [month, monthDate]);

  console.log(Localization.timezone);
  console.log("👶"); // Pacific/Auckland
  console.log(Localization.locale); // en-NZ

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D68089" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderSettings title={displayMonth} onBackPress={goBack} />

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.diaryId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const zonedDate = utcToZonedTime(new Date(`${item.diaryDate}T00:00:00Z`), timeZone);

          return (
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
                  {format(zonedDate, "yyyy년 M월 d일 (E)", { locale })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => <Text style={styles.emptyText}>작성된 일기가 없습니다.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
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
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  cardImage: {
    width: 120,
    height: 120,
    resizeMode: "cover"
  },
  cardTextContainer: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between"
  },
  cardContent: {
    fontSize: 16,
    color: "#A78C7B",
    lineHeight: 22
  },
  cardDate: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "right"
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#999"
  },
  dayStandardBackground: {
    flex: 1
  }
});
