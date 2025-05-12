import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import IconButton from "../components/IconButton";
import { usePhoto } from "../contexts/PhotoContext";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function LoadingPage() {
  const nav = useRouter();
  const { photoList, selected, mode } = usePhoto();
  const { token } = useAuth();

  useEffect(() => {
    const recommend = async () => {
      try {
        if (photoList.length <= 9) {
          nav.push({
            pathname: `/${mode}`,
            params: {
              photos: JSON.stringify({
                recommendedPhotoIds: photoList.map((p) => p.id),
              }),
            },
          });
          return;
        }
        const res = await fetch(
          `${BACKEND_URL}/api/photos/selection/ai-recommend`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uploadedPhotoIds: photoList.map((p) => p.id),
              mandatoryPhotoIds: selected.map((p) => p.id),
            }),
          }
        );

        const result = await res.json();
        console.log("AI 추천 결과:", result);

        nav.push({
          pathname: `/${mode}`,
          params: {
            photos: JSON.stringify({
              recommendedPhotoIds: result.recommendedPhotoIds,
            }),
          },
        });
      } catch (err) {
        console.error("AI 추천 실패:", err);
        nav.push(`/${mode}`, {
          photos: JSON.stringify(selected),
        });
      }
    };

    recommend();
  }, []);

  return (
    <View style={styles.container}>
      {/* 상단 뒤로가기 버튼 */}
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => nav.back()}
        />
      </View>

      <ActivityIndicator size="large" color="#D68089" />
      <Text style={styles.text}>AI가 사진을 분석 중입니다...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 60,
    left: 30,
    zIndex: 10,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#a78c7b",
  },
});
