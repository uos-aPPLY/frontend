// app/loadingPicture.jsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { uploadPhotos } from "../../utils/uploadPhotos";
import { usePhoto } from "../../contexts/PhotoContext";
import { useAuth } from "../../contexts/AuthContext";
import * as ImageManipulator from "expo-image-manipulator";
import colors from "../../constants/colors";

export default function LoadingPicture() {
  const nav = useRouter();
  const { token } = useAuth();
  const { selectedAssets, setPhotoList, setTempPhotoList, setMainPhotoId } = usePhoto();

  useEffect(() => {
    const processAndUpload = async () => {
      try {
        if (!selectedAssets || selectedAssets.length === 0) {
          Alert.alert("오류", "선택된 사진이 없습니다.");
          nav.replace("/");
          return;
        }

        // 1. Resize & compress
        const resized = await Promise.all(
          selectedAssets.map((asset) =>
            ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG
            })
          )
        );

        // 2. Upload to backend
        const uploaded = await uploadPhotos(resized, token, selectedAssets);

        if (!uploaded || uploaded.length === 0) {
          throw new Error("서버로부터 응답된 사진 정보가 없습니다.");
        }

        const formatted = uploaded.map((p) => ({
          id: p.id,
          photoUrl: p.photoUrl
        }));

        setPhotoList(formatted);
        setTempPhotoList(formatted);
        setMainPhotoId(String(formatted[0].id));

        // 4. write 페이지로 이동
        nav.replace("/write");
      } catch (error) {
        console.error("❌ 사진 업로드 중 오류:", error);
        Alert.alert("업로드 실패", "사진 업로드 중 오류가 발생했습니다.");
        nav.replace("/"); // 실패 시 fallback
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
    color: colors.textDark
  }
});
