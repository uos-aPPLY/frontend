import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhotos } from "./uploadPhotos";
import { usePhoto } from "../contexts/PhotoContext";

/**
 * 갤러리 열고 사진을 업로드한 뒤 서버 응답 리스트 반환
 * @param {string} token - 인증 토큰
 * @returns {Promise<UploadedPhoto[]>} - 서버에서 응답받은 업로드 결과
 */
export const openGalleryAndAdd = async (token) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("갤러리 접근 권한이 필요합니다.");
    return [];
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
      return [];
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

      // ✅ 서버 응답을 받는다
      const uploadedPhotos = await uploadPhotos(
        resizedAssets,
        token,
        originalAssets
      );

      return uploadedPhotos; // ✅ 서버에서 받은 id, photoUrl 포함된 객체들
    } catch (error) {
      console.error("업로드 실패", error);
      return [];
    }
  }

  return [];
};
