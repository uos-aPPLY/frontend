import { InteractionManager, Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhotos } from "./uploadPhotos";

/**
 * 갤러리 열고 사진 업로드하는 함수
 * @param {string} token - 인증 토큰
 * @param {Function} navigate - 성공 시 이동할 함수 (예: nav.push)
 */
export const openGalleryAndUpload = async (token, navigate, mode) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  const maxCount = mode === "choose" ? 9 : 40;

  if (!permission.granted) {
    Alert.alert(
      "갤러리 접근 권한 필요",
      "사진을 선택하려면 갤러리 접근 권한이 필요합니다.\n설정에서 권한을 허용해주세요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "설정으로 이동",
          onPress: () => Linking.openSettings()
        }
      ]
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 1,
    exif: true
  });

  if (!result.canceled) {
    const originalAssets = result.assets;

    // ✅ recommend 모드일 때 10장 이상 선택 요구
    if (mode === "recommend" && originalAssets.length < 10) {
      alert("추천을 받으려면 최소 10장의 사진을 선택해주세요.");
      return;
    }
    if (!token) {
      console.error("토큰이 없습니다. 로그인 후 다시 시도하세요.");
      return;
    }

    requestAnimationFrame(() => {
      navigate.push("/loading/loadingPicture");
    });

    InteractionManager.runAfterInteractions(async () => {
      try {
        const originalAssets = result.assets;
        const resizedAssets = await Promise.all(
          originalAssets.map((asset) =>
            ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG
            })
          )
        );

        await uploadPhotos(resizedAssets, token, originalAssets);
        navigate.replace("/confirmPhoto");
      } catch (error) {
        console.error("업로드 실패", error);
      }
    });
  }
};
