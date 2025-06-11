import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import IconButton from "../components/IconButton";
import { usePhoto } from "../contexts/PhotoContext";
import ConfirmModal from "../components/Modal/ConfirmModal";
import { useNavigation } from "@react-navigation/native";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function LoadingPage() {
  const nav = useRouter();
  const navigation = useNavigation();
  const { photoList, selected, setPhotoList, setSelected, setMainPhotoId, mode } = usePhoto();
  const { token } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // ✅ iOS 슬라이딩 뒤로가기 막기
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    const recommend = async () => {
      try {
        if (photoList.length <= 9) {
          if (isCancelledRef.current) return;

          const selectedIds = photoList.map((p) => p.id);

          setSelected(photoList);
          setMainPhotoId(String(photoList[0]?.id || null));

          const destination =
            mode === "write"
              ? "/write"
              : {
                  pathname: "/generate",
                  params: {
                    photos: JSON.stringify(selectedIds),
                    fullPhotoList: JSON.stringify(photoList)
                  }
                };

          nav.replace(destination);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/photos/selection/ai-recommend`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uploadedPhotoIds: photoList.map((p) => p.id),
            mandatoryPhotoIds: selected.map((p) => p.id)
          })
        });

        const result = await res.json();
        if (isCancelledRef.current) return;

        const recommended = result.recommendedPhotoIds
          .map((id) => photoList.find((p) => p.id === id))
          .filter(Boolean);

        setPhotoList(recommended);
        setSelected(recommended);
        setMainPhotoId(String(recommended[0]?.id || null));

        setTimeout(() => {
          if (!isCancelledRef.current) {
            const destination =
              mode === "write"
                ? "/write"
                : {
                    pathname: "/generate",
                    params: {
                      photos: JSON.stringify(result.recommendedPhotoIds),
                      fullPhotoList: JSON.stringify(photoList)
                    }
                  };
            nav.replace(destination);
          }
        }, 0);
      } catch (err) {
        console.error("AI 추천 실패:", err);
        if (!isCancelledRef.current) {
          nav.replace(`/${mode}`);
        }
      }
    };

    recommend();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.text}>
          {"베스트샷을 고르는 중이에요...📸\n 앱을 전환하거나 닫지 마시고, 잠시만 기다려주세요."}
        </Text>
      </View>

      <ConfirmModal
        visible={isModalVisible}
        title="정말로 뒤로 가시겠어요?"
        message="베스트샷 추천 결과가 초기화돼요."
        onCancel={() => setIsModalVisible(false)}
        onConfirm={() => {
          isCancelledRef.current = true;
          setIsModalVisible(false);
          nav.back();
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
    backgroundColor: "#FCF9F4"
  },
  header: {
    paddingTop: 60,
    paddingLeft: 30
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: "#A78C7B",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22
  }
});
