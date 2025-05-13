import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhotos } from "./uploadPhotos";

/**
 * 갤러리 열고 사진 업로드하는 함수
 * @param {string} token - 인증 토큰
 * @param {Function} navigate - 성공 시 이동할 함수 (예: nav.push)
 */
export const openGalleryAndUpload = async (token, navigate) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("갤러리 접근 권한이 필요합니다.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 160,
    quality: 1,
    exif: true,
  });

  if (!result.canceled) {
    if (!token) {
      console.error("토큰이 없습니다. 로그인 후 다시 시도하세요.");
      return;
    }

    try {
      const originalAssets = result.assets;

      const resizedAssets = await Promise.all(
        originalAssets.map((asset) =>
          ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 400 } }],
            {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          )
        )
      );

      await uploadPhotos(resizedAssets, token, originalAssets);
      navigate("/confirmPhoto");
    } catch (error) {
      console.error("업로드 실패", error);
    }
  }
};
