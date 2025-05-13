import { useRouter } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import HeaderDefault from "../../components/Header/HeaderDefault";
import IconButton from "../../components/IconButton";
import { useDiary } from "../../contexts/DiaryContext";

export default function Home() {
  const nav = useRouter();

  const messages = [
    "지금 이 순간이 내일의 추억이 되도록, \n사진 한 장을 남겨보세요.",
    "평범한 오늘도 기록해두면 \n특별한 이야기가 되어 돌아옵니다.",
    "사진 한 장이 당신의 하루를 \n말없이 들려줄 거예요.",
    "소중한 순간을 놓치지 않도록, \n지금 바로 올려볼까요?",
    "작은 순간도 기억으로 남길 때 \n비로소 빛나기 시작합니다.",
    "오늘 찍은 한 장의 사진으로 \n내일은 더 다정해질 거예요.",
    "과거와 미래가 만나는 그곳, \n사진 속에서 이야기해요.",
  ];

  const today = new Date().getDay();
  const message = messages[today];
  const { selectedDate, setSelectedDate } = useDiary();

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
            onPress={() => {
              setSelectedDate(new Date());
              nav.push("/create");
            }}
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

    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
