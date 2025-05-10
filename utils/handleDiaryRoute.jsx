import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

export const handleDiaryRoute = async ({
  mode,
  selected,
  photoList,
  token,
  nav,
}) => {
  const isNeedRecommendation = selected.length < 9 && photoList.length > 9;

  if (isNeedRecommendation) {
    nav.push("/loading");

    console.log("photoList:", photoList);
    console.log("selected:", selected);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/photos/selection/ai-recommend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadedPhotoIds: photoList,
            mandatoryPhotoIds: selected,
          }),
        }
      );
      const text = await res.text(); // 👈 여기 먼저 확인
      console.log("응답 본문 (text):", text);

      const result = JSON.parse(text); // 오류가 없다면 이걸로 파싱
      console.log("AI 추천 결과:", result);

      nav.push(`/${mode}`, { photos: result });
    } catch (error) {
      console.error("AI 추천 실패:", error);
      nav.push(`/${mode}`, { photos: selected });
    }
  } else {
    nav.push(`/${mode}`, { photos: selected });
  }
};
