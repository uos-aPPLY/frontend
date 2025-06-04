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
import { clearAllTempPhotos } from "../../utils/clearTempPhotos";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function LoadingBestShot() {
  const {
    selectedAssets,
    setSelected,
    setPhotoList,
    setMainPhotoId,
    setTempPhotoList,
    setSelectedAssets,
    resetPhoto,
    selected,
    photoList,
    mode,
    clear
  } = usePhoto();
  const { token } = useAuth();
  const nav = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      try {
        console.log("🧭 mode:", mode);
        console.log("📸 selectedAssets:", selectedAssets);
        console.log("🛡 token:", token);

        if (token && clear) {
          try {
            await clearAllTempPhotos(token);
            console.log("🧹 기존 임시 사진 삭제 완료");
          } catch (err) {
            console.warn("⚠️ 임시 사진 삭제 실패:", err);
          }
        }

        if (!token) {
          Alert.alert("오류", "토큰이 없습니다.");
          nav.replace("/customGallery");
          return;
        }

        // 🟨 CASE 1: 사진 선택 후 mode == 'select' -> AI 추천만 수행
        if (mode === "select") {
          if (!selected || selected.length === 0 || photoList.length === 0) {
            Alert.alert("오류", "추천할 사진이 없습니다.");
            nav.replace("/customGallery");
            return;
          }

          const uploadedPhotoIds = photoList.map((p) => p.id);
          const mandatoryPhotoIds = selected.map((p) => p.id);

          const res = await fetch(`${BACKEND_URL}/api/photos/selection/ai-recommend`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              uploadedPhotoIds,
              mandatoryPhotoIds
            })
          });

          const contentType = res.headers.get("content-type");
          let result;

          if (contentType && contentType.includes("application/json")) {
            result = await res.json();
          } else {
            const text = await res.text();
            console.error("❌ 예상치 못한 응답:", text);
            throw new Error("서버에서 잘못된 응답을 보냈습니다.");
          }

          console.log("🧠 추천 결과:", result);

          if (!res.ok || !Array.isArray(result.recommendedPhotoIds)) {
            console.error("🔥 베스트샷 추천 실패:", result);
            Alert.alert("오류", "추천 결과를 받아오지 못했습니다.");
            nav.replace("/customGallery");
            return;
          }

          const recommended = result.recommendedPhotoIds
            .map((id) => photoList.find((p) => p.id === id))
            .filter(Boolean);

          if (recommended.length === 0) {
            Alert.alert("추천 실패", "AI가 사진을 추천하지 못했어요.");
            nav.replace("/customGallery");
            return;
          }

          setSelected(recommended);
          setMainPhotoId(String(recommended[0]?.id || null));

          if (!isCancelledRef.current) {
            nav.replace("/bestshotReorder");
          }
          return;
        }

        // 🟩 CASE 2: 기본 업로드 + AI 추천
        if (!selectedAssets || selectedAssets.length === 0) {
          Alert.alert("오류", "업로드할 사진이 없습니다.");
          nav.replace("/customGallery");
          return;
        }

        const resolvedAssets = await Promise.all(
          selectedAssets.map(async (asset) => {
            const info = await MediaLibrary.getAssetInfoAsync(asset.id);
            return {
              ...asset,
              uri: info.localUri || asset.uri
            };
          })
        );

        console.log("🛠 이미지 리사이즈 시작");
        const resized = await Promise.all(
          resolvedAssets.map((asset, i) => {
            console.log(`📷 리사이즈 대상 ${i}:`, asset.uri);
            return ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG
            });
          })
        );
        console.log("✅ 이미지 리사이즈 완료:", resized);

        const uploaded = await uploadPhotos(resized, token, resolvedAssets);

        if (!uploaded || uploaded.length === 0) throw new Error("업로드 실패");

        const formatted = uploaded.map((p) => ({
          id: p.id,
          photoUrl: p.photoUrl
        }));

        setPhotoList(formatted);
        setTempPhotoList(formatted);
        setMainPhotoId(String(formatted[0].id));
        setSelectedAssets([]);

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
        console.log("🧠 추천 결과:", result);

        if (!res.ok || !Array.isArray(result.recommendedPhotoIds)) {
          console.error("🔥 베스트샷 추천 실패:", result);
          Alert.alert("오류", "추천 결과를 받아오지 못했습니다.");
          nav.replace("/customGallery");
          return;
        }

        const recommended = result.recommendedPhotoIds
          .map((id) => uploaded.find((p) => p.id === id))
          .filter(Boolean);

        if (recommended.length === 0) {
          Alert.alert("추천 실패", "AI가 사진을 추천하지 못했어요.");
          nav.replace("/customGallery");
          return;
        }

        setSelected(recommended);
        setMainPhotoId(String(recommended[0]?.id || null));

        if (!isCancelledRef.current) {
          nav.replace("/bestshotReorder");
        }
      } catch (err) {
        console.error("🔥 에러 발생:", err);
        Alert.alert("오류", err.message || "예상치 못한 오류가 발생했습니다.");
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
          onPress={async () => {
            setIsModalVisible(true);
            setSelectedAssets([]);
            resetPhoto();
          }}
        />
      </View>

      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color={colors.pinkpoint} />
        <Text style={styles.text}>
          {"AI가 베스트샷을 고르는 중이에요...\n 생각보다 시간이 소요될 수 있어요💫"}
        </Text>
      </View>

      <ConfirmModal
        visible={isModalVisible}
        title="정말로 뒤로 가시겠어요?"
        message="추천 결과가 사라지고 처음으로 돌아가요."
        onCancel={() => setIsModalVisible(false)}
        onConfirm={() => {
          isCancelledRef.current = true;
          setIsModalVisible(false);
          nav.replace("/customGallery");
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
    paddingTop: 75,
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
