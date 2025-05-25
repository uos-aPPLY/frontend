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
        console.log("AI 추천 요청:", {
          uploadedPhotoIds: photoList.map((p) => p.id),
          mandatoryPhotoIds: selected.map((p) => p.id),
        });

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
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => nav.back()}
        />
      </View>
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.text}>AI가 베스트샷 선정 중 입니다...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  header: {
    paddingTop: 75,
    paddingLeft: 30,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#a78c7b",
  },
});
