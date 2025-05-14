import { View, Text, StyleSheet } from "react-native";
import IconButton from "../IconButton";
import { useRouter } from "expo-router";

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateWithDay(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "날짜 없음";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayName = dayNames[date.getDay()];
  return `${year}.${month}.${day} (${dayName})`;
}

export default function HeaderDate({ date, onBack, onTrashPress }) {
  const formatted = formatDateWithDay(date);
  const nav = useRouter();

  return (
    <View style={styles.header}>
      <IconButton
        source={require("../../assets/icons/backicon.png")}
        hsize={24}
        wsize={24}
        style={styles.back}
        onPress={onBack}
      />
      <Text style={styles.date}>{formatted}</Text>

      {/* 오른쪽 아이콘 로직 */}

      <IconButton
        source={require("../../assets/icons/trashcanicon.png")}
        hsize={24}
        wsize={24}
        onPress={onTrashPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 75,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
    marginBottom: 15,
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a78c7b",
    textAlign: "center",
  },
});
