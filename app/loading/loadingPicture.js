// app/loading/loadingPicture.jsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePhoto } from "../../contexts/PhotoContext";
import { useAuth } from "../../contexts/AuthContext";
import { uploadPhotos } from "../../utils/uploadPhotos";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";

export default function LoadingPicture() {
  const nav = useRouter();
  const {
    selectedAssets,
    setPhotoList,
    setTempPhotoList,
    setMainPhotoId,
    setSelectedAssets,
    mode
  } = usePhoto();
  const { token } = useAuth();

  useEffect(() => {
    const process = async () => {
      try {
        if (!selectedAssets || selectedAssets.length === 0) {
          Alert.alert("오류", "선택된 사진이 없습니다.");
          nav.replace("/");
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

        // 1. 이미지 리사이징
        const resized = await Promise.all(
          resolvedAssets.map((asset) =>
            ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG
            })
          )
        );

        // 2. 서버 업로드
        console.log("📤 업로드 시작:", resized.length, "개의 사진");
        const uploaded = await uploadPhotos(resized, token, selectedAssets);

        if (!uploaded || uploaded.length === 0) throw new Error("업로드 실패");

        // 3. 상태 저장
        const formatted = uploaded.map((p) => ({
          id: p.id,
          photoUrl: p.photoUrl
        }));

        setPhotoList(formatted);
        setTempPhotoList(formatted);
        setMainPhotoId(String(formatted[0].id));
        setSelectedAssets([]);

        // 4. 경로 분기
        if (mode === "bestshot") {
          nav.replace("/confirmPhoto");
          return;
        }
        nav.replace("/generate");
      } catch (err) {
        console.error("❌ 업로드 오류:", err);
        Alert.alert("업로드 실패", "사진 업로드 중 오류가 발생했습니다.");
        nav.replace("/");
      }
    };

    process();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D68089" />
        <Text style={styles.message}>사진을 업로드 중이에요...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: "#A78C7B",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22
  }
});
