import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { uploadPhotos } from "../../utils/uploadPhotos";
import { usePhoto } from "../../contexts/PhotoContext";
import { useAuth } from "../../contexts/AuthContext";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import colors from "../../constants/colors";

export default function loadingWrite() {
  const nav = useRouter();
  const { token } = useAuth();
  const { selectedAssets, setPhotoList, setTempPhotoList, setMainPhotoId } = usePhoto();

  useEffect(() => {
    const processAndUpload = async () => {
      try {
        console.log("📸 선택된 자산:", selectedAssets);

        if (!selectedAssets || selectedAssets.length === 0) {
          Alert.alert("오류", "선택된 사진이 없습니다.");
          nav.replace("/");
          return;
        }

        // ✅ Step 1: Resolve localUri for each asset
        const resolvedAssets = await Promise.all(
          selectedAssets.map(async (asset) => {
            const info = await MediaLibrary.getAssetInfoAsync(asset.id);
            if (!info.localUri) {
              throw new Error(`localUri not found for asset: ${asset.id}`);
            }
            return {
              ...asset,
              uri: info.localUri
            };
          })
        );
        console.log(
          "📂 localUri 확보 완료:",
          resolvedAssets.map((a) => a.uri)
        );

        // ✅ Step 2: Resize images
        console.log("🛠 리사이징 시작...");
        const resized = await Promise.all(
          resolvedAssets.map((asset) =>
            ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG
            })
          )
        );
        console.log(
          "✅ 리사이징 완료:",
          resized.map((r) => r.uri)
        );

        // ✅ Step 3: Upload to server
        console.log("📤 업로드 시작...");
        const uploaded = await uploadPhotos(resized, token, resolvedAssets);

        if (!uploaded || uploaded.length === 0) {
          throw new Error("서버로부터 응답된 사진 정보가 없습니다.");
        }

        console.log("✅ 업로드 완료:", uploaded);

        // ✅ Step 4: Save to context
        const formatted = uploaded.map((p) => ({
          id: p.id,
          photoUrl: p.photoUrl
        }));
        console.log("🗂 포맷 완료:", formatted);

        setPhotoList(formatted);
        setTempPhotoList(formatted);
        setMainPhotoId(String(formatted[0].id));

        console.log("🚀 write 페이지로 이동합니다...");
        nav.replace("/write");
      } catch (error) {
        console.error("❌ 사진 업로드 중 오류:", error);
        Alert.alert("업로드 실패", error.message || "사진 업로드 중 오류가 발생했습니다.");
        nav.replace("/");
      }
    };

    processAndUpload();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.pinkpoint} />
      <Text style={styles.text}>사진 업로드 중입니다...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgorund,
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: colors.brown
  }
});
