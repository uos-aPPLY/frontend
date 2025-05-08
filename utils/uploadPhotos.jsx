// utils/uploadPhotos.js
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

export async function uploadPhotos(assets, token) {
  const formData = new FormData();

  assets.forEach((asset, index) => {
    const uriParts = asset.uri.split(".");
    const fileType = uriParts[uriParts.length - 1];

    formData.append("files", {
      uri: asset.uri,
      name: `photo_${index}.${fileType}`,
      type: `image/${fileType}`,
    });
  });

  const response = await fetch(`${BACKEND_URL}/api/photos/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const responseText = await response.text();
  console.log("응답 내용 확인:", responseText);
  console.log("백엔드 주소:", BACKEND_URL);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("업로드 중 에러:", errorText);
    throw new Error(`업로드 실패: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log("업로드 성공:", data);
  return data;
}
