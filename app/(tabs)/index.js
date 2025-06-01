import { useRouter } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import HeaderDefault from "../../components/Header/HeaderDefault";
import IconButton from "../../components/IconButton";
import { useDiary } from "../../contexts/DiaryContext";
import Constants from "expo-constants";
import { format } from "date-fns";

export default function Home() {
  const nav = useRouter();
  const { setSelectedDate } = useDiary();

  const messages = [
    "지금 이 순간이 내일의 추억이 되도록, \n사진 한 장을 남겨보세요.",
    "평범한 오늘도 기록해두면 \n특별한 이야기가 되어 돌아옵니다.",
    "사진 한 장이 당신의 하루를 \n말없이 들려줄 거예요.",
    "소중한 순간을 놓치지 않도록, \n지금 바로 올려볼까요?",
    "작은 순간도 기억으로 남길 때 \n비로소 빛나기 시작합니다.",
    "오늘 찍은 한 장의 사진으로 \n내일은 더 다정해질 거예요.",
    "과거와 미래가 만나는 그곳, \n사진 속에서 이야기해요.",
  ];

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const message = messages[today.getDay()];
  const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;

  const fetchDiaryByDate = async () => {
    const url = `${BACKEND_URL}/api/diaries/by-date?date=${todayStr}`;
    const response = await fetch(url); // 전역 fetch를 통해 자동 토큰 갱신

    console.log("📡 응답 상태 코드:", response.status);
    const text = await response.text();
    console.log("📄 응답 본문:", text);

    try {
      return {
        status: response.status,
        json: JSON.parse(text),
      };
    } catch (e) {
      console.error("❌ JSON 파싱 실패:", e);
      return {
        status: response.status,
        json: null,
      };
    }
  };

  const handlePress = async () => {
    console.log("📸 홈 버튼 클릭", todayStr);
    const res = await fetchDiaryByDate();

    if (res.status === 204 || !res.json) {
      console.log("⛔️ 일기 없음 → 작성 페이지로");
      setSelectedDate(todayStr);
      nav.push(`/create?date=${todayStr}&from=calendar`);
      return;
    }

    if (res.status === 200 && typeof res.json.id === "number") {
      console.log("✅ 일기 있음 → 캘린더 이동");
      nav.push("/calendar");
      return;
    }

    console.log("⚠️ 알 수 없는 응답 → 작성 페이지 이동");
    setSelectedDate(todayStr);
    nav.push(`/create?date=${todayStr}&from=calendar`);
  };

  return (
    <>
      <HeaderDefault />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.message}>{message}</Text>
          <IconButton
            source={require("../../assets/icons/bigpinkplusicon.png")}
            hsize={50}
            wsize={50}
            onPress={handlePress}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  card: {
    width: "100%",
    height: 235,
    backgroundColor: "#FFFEFE",
    borderRadius: 30,
    padding: 45,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#A8907C",
    lineHeight: 30,
  },
});
