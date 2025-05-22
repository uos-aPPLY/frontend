import { View, Text, StyleSheet } from "react-native";
import IconButton from "../IconButton";
import { useEffect } from "react";
import { useDiary } from "../../contexts/DiaryContext";

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

export default function HeaderDate({ date, onBack, hasText = false, onSave }) {
  const formatted = formatDateWithDay(date);
  const { setSelectedDate } = useDiary();

  useEffect(() => {
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed)) {
        console.log(
          "📌 HeaderDate에서 selectedDate 설정:",
          parsed.toISOString()
        );
        setSelectedDate(parsed);
      }
    }
  }, [date]);

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
      {hasText ? (
        <IconButton
          source={require("../../assets/icons/browncheckicon.png")}
          hsize={24}
          wsize={24}
          style={styles.check}
          onPress={onSave}
        />
      ) : (
        <View style={{ width: 24 }} />
      )}
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
