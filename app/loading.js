import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import IconButton from "../components/IconButton";
import { usePhoto } from "../contexts/PhotoContext";
import ConfirmModal from "../components/Modal/ConfirmModal";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function LoadingPage() {
  const nav = useRouter();
  const {
    photoList,
    selected,
    setPhotoList,
    setSelected,
    setMainPhotoId,
    mode,
  } = usePhoto();
  const { token } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const recommend = async () => {
      try {
        if (photoList.length <= 9) {
          if (isCancelledRef.current) return;
          setSelected(photoList);
          setMainPhotoId(String(photoList[0]?.id || null));
          nav.push(`/${mode}`);
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
        if (isCancelledRef.current) return;

        const recommended = result.recommendedPhotoIds
          .map((id) => photoList.find((p) => p.id === id))
          .filter(Boolean);

        setPhotoList(recommended);
        setSelected(recommended);
        setMainPhotoId(String(recommended[0]?.id || null));

        if (!isCancelledRef.current) {
          const destination =
            mode === "write"
              ? "/write"
              : {
                  pathname: "/generate",
                  params: {
                    photos: JSON.stringify(result.recommendedPhotoIds),
                    fullPhotoList: JSON.stringify(photoList), // ✅ 핵심 추가
                  },
                };
          nav.push(destination);
        }
      } catch (err) {
        console.error("AI 추천 실패:", err);
        if (!isCancelledRef.current) {
          nav.push(`/${mode}`);
        }
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
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.text}>AI가 베스트샷 선정 중 입니다...</Text>
      </View>

      <ConfirmModal
        visible={isModalVisible}
        title="정말로 뒤로 가시겠어요?"
        message="베스트샷 추천 결과가 초기화돼요."
        onCancel={() => setIsModalVisible(false)}
        onConfirm={() => {
          isCancelledRef.current = true;
          setIsModalVisible(false);
          nav.replace("/confirmPhoto");
        }}
        cancelText="취소"
        confirmText="뒤로가기"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  header: {
    paddingTop: 60,
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
