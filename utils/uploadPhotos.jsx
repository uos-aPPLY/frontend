// utils/uploadPhotos.js
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

export async function uploadPhotos(resizedAssets, token, originalAssets) {
  const formData = new FormData();
  const metadataArray = [];

  resizedAssets.forEach((resized, index) => {
    const fileType = resized.uri.split(".").pop();
    formData.append("files", {
      uri: resized.uri,
      name: `photo_${index}.${fileType}`,
      type: `image/${fileType}`,
    });

    const original = originalAssets[index];
    const exif = original.exif || {};

    const location =
      exif.GPSLatitude && exif.GPSLongitude
        ? { latitude: exif.GPSLatitude, longitude: exif.GPSLongitude }
        : null;

    let shootingDateTime = null;
    if (exif.DateTimeOriginal) {
      const [datePart, timePart] = exif.DateTimeOriginal.split(" ");
      if (datePart && timePart) {
        shootingDateTime = `${datePart.replace(/:/g, "-")}T${timePart}`;
      }
    }

    metadataArray.push({
      location,
      shootingDateTime,
    });
  });

  formData.append("metadata", JSON.stringify(metadataArray));

  for (const pair of formData.entries()) {
    console.log("❤️formData entry:", pair[0], pair[1]);
  }

  const response = await fetch(`${BACKEND_URL}/api/photos/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const responseText = await response.text();

  console.log("응답 코드:", response.status);
  console.log("응답 본문:", responseText);

  if (!response.ok) {
    console.error("업로드 중 에러:", responseText);
    throw new Error(`업로드 실패: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  console.log("업로드 성공:", data);
  return data;
}
