// app/diary/[date].js
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import IconButton from "../../components/IconButton";
import HeaderDate from "../../components/Header/HeaderDate";

const screenWidth = Dimensions.get("window").width;

export default function DiaryPage() {
  const { date: dateParam } = useLocalSearchParams();
  const date = dateParam;
  const { token } = useAuth();
  const nav = useRouter();

  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ 로딩 상태 분리

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const res = await fetch(
          `${Constants.expoConfig.extra.BACKEND_URL}/api/diaries/by-date?date=${date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          setDiary(undefined);
        } else {
          const text = await res.text();
          if (!text) {
            setDiary(undefined);
          } else {
            const data = JSON.parse(text);
            setDiary(data);
          }
        }
      } catch (error) {
        console.error("📛 다이어리 로딩 실패", error);
        setDiary(undefined);
      } finally {
        setLoading(false);
      }
    };
    if (date && token) fetchDiary();
  }, [date, token]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.backButtonWrapper}>
          <IconButton
            source={require("../../assets/icons/backicon.png")}
            wsize={22}
            hsize={22}
            onPress={() => nav.push("/calendar")}
          />
        </View>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.loadingText}>일기를 불러오는 중이에요...</Text>
      </View>
    );
  }

  if (diary === undefined) {
    return (
      <View style={styles.loader}>
        <View style={styles.backButtonWrapper}>
          <IconButton
            source={require("../../assets/icons/backicon.png")}
            wsize={22}
            hsize={22}
            onPress={() => nav.push("/calendar")}
          />
        </View>
        <Text style={styles.loadingText}>해당 날짜에 일기가 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <HeaderDate date={date} onBack={() => nav.push("/calendar")} />

      <View style={styles.imageWrapper}>
        <FlatList
          data={diary.photos}
          keyExtractor={(item, index) =>
            item.id?.toString() ?? index.toString()
          }
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
          )}
        />

        <View style={styles.pageIndicator}>
          {diary.photos?.map((photo, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                photo.photoUrl === diary.representativePhotoUrl &&
                  styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.characterWrapper}>
        <Image source={{ uri: diary.characterUrl }} style={styles.character} />
      </View>

      <Text style={styles.text}>{diary.text}</Text>

      <View style={styles.iconBar}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  loader: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  backButtonWrapper: {
    position: "absolute",
    top: 60,
    left: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#A78C7B",
  },
  imageWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  image: {
    width: screenWidth * 0.85,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: (screenWidth * 0.15) / 2, // 중앙 정렬
  },

  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: "#A78C7B",
  },
  characterWrapper: {
    alignItems: "center",
    marginVertical: 10,
  },
  character: {
    width: 32,
    height: 32,
  },
  text: {
    fontSize: 14,
    lineHeight: 24,
    color: "#3F3F3F",
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  iconBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 40,
  },
});
