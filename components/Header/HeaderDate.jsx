import { View, Text, StyleSheet } from "react-native";
import IconButton from "../IconButton";

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateWithDay(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayName = dayNames[date.getDay()];
  return `${year}.${month}.${day} (${dayName})`;
}

export default function HeaderDate({ date, onBack, hasText = false }) {
  const formatted = formatDateWithDay(date);

  return (
    <View style={styles.header}>
      <IconButton
        source={require("../assets/icons/backicon.png")}
        hsize={22}
        wsize={22}
        style={styles.back}
        onPress={onBack}
      />
      <Text style={styles.date}>{formatted}</Text>
      {hasText ? (
        <IconButton
          source={require("../assets/icons/browncheckicon.png")}
          wsize={22}
          hsize={22}
          style={styles.check}
          onPress={() => {}}
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
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b",
    textAlign: "center",
  },
});
