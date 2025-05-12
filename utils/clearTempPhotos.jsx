import Constants from "expo-constants";
const { BACKEND_URL } = Constants.expoConfig.extra;

/**
 * 특정 ID의 임시 사진을 삭제합니다.
 * @param {string | number} id - 삭제할 사진의 ID
 * @param {string} token - 사용자 인증 토큰
 */
export const deletePhotoById = async (id, token) => {
  try {
    await fetch(`${BACKEND_URL}/api/photos/selection/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`✅ 사진 ID ${id} 삭제 완료`);
  } catch (error) {
    console.error(`❌ 사진 ID ${id} 삭제 실패:`, error);
  }
};

/**
 * 모든 임시 사진을 삭제합니다.
 * @param {string} token - 사용자 인증 토큰
 */
export const clearAllTempPhotos = async (token) => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    const ids = data.map((photo) => photo.id);

    await Promise.all(ids.map((id) => deletePhotoById(id, token)));

    console.log("✅ 모든 임시 사진 삭제 완료");
  } catch (error) {
    console.error("❌ 임시 사진 목록 불러오기 실패:", error);
  }
};
