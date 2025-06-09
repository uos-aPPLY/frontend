import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhotos } from "./uploadPhotos";

/**
 * 갤러리 열고 사진을 업로드한 뒤 서버 응답 리스트 반환
 * @param {string} token - 인증 토큰
 * @param {number} existingCount - 이미 선택된 사진의 개수
 * @returns {Promise<UploadedPhoto[]>} - 서버에서 응답받은 업로드 결과
 */
export const openGalleryAndAdd = async (token, existingCount = 0) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("갤러리 접근 권한이 필요합니다.");
    return [];
  }

  const maxTotal = 9;
  const remaining = maxTotal - existingCount;

  if (remaining <= 0) {
    alert("사진은 최대 9장까지 선택할 수 있습니다.");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining, // ✅ 남은 개수만큼만 선택 가능
    quality: 1,
    exif: true
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
          ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG
          })
        )
      );

      const uploadedPhotos = await uploadPhotos(resizedAssets, token, originalAssets);

      return uploadedPhotos;
    } catch (error) {
      console.error("업로드 실패", error);
      return [];
    }
  }

  return [];
};
