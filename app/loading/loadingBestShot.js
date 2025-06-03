import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePhoto } from "../../contexts/PhotoContext";
import { useAuth } from "../../contexts/AuthContext";
import { uploadPhotos } from "../../utils/uploadPhotos";
import colors from "../../constants/colors";
import Constants from "expo-constants";
import IconButton from "../../components/IconButton";
import ConfirmModal from "../../components/Modal/ConfirmModal";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function LoadingBestShot() {
  const { selectedAssets, setSelected, setPhotoList, setMainPhotoId } = usePhoto();
  const { token } = useAuth();
  const nav = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      try {
        console.log("📸 selectedAssets:", selectedAssets);
        console.log("🛡 token:", token);
        if (!token || !selectedAssets || selectedAssets.length === 0) {
          Alert.alert("오류", "업로드할 사진이 없습니다.");
          nav.replace("/customGallery");
          return;
        }

        // 2. 서버 업로드
        const uploaded = await uploadPhotos(selectedAssets, token, selectedAssets);

        if (!uploaded || uploaded.length === 0) throw new Error("업로드 실패");

        // 3. 상태 저장
        const formatted = uploaded.map((p) => ({
          id: p.id,
          photoUrl: p.photoUrl
        }));

        // 2. 추천 API 호출
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/ai-recommend`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uploadedPhotoIds: uploaded.map((p) => p.id),
            mandatoryPhotoIds: []
          })
        });

        const result = await res.json();

        if (!res.ok || !result || typeof result !== "object") {
          console.error("🔥 베스트샷 추천 실패:", result);
          Alert.alert("오류", "추천 결과를 받아오지 못했습니다.");
          nav.replace("/customGallery");
          return;
        }

        const recommended = result.recommendedPhotoIds
          .map((id) => uploaded.find((p) => p.id === id))
          .filter(Boolean);

        setPhotoList(recommended);
        setSelected(recommended);
        setMainPhotoId(String(recommended[0]?.id || null));

        if (!isCancelledRef.current) {
          nav.replace({
            pathname: "/generate",
            params: {
              photos: JSON.stringify(recommended),
              fullPhotoList: JSON.stringify(uploaded)
            }
          });
        }
      } catch (err) {
        console.error("🔥 에러 발생:", err);
        Alert.alert("오류", "예상치 못한 오류가 발생했습니다.");
        nav.replace("/customGallery");
      }
    };

    run();

    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color={colors.pinkpoint} />
        <Text style={styles.text}>AI가 베스트샷을 고르는 중이에요...</Text>
      </View>

      <ConfirmModal
        visible={isModalVisible}
        title="정말로 뒤로 가시겠어요?"
        message="추천 결과가 사라지고 처음으로 돌아가요."
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
    fontSize: 16,
    color: "#a78c7b",
    textAlign: "center"
  }
});
