import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import HeaderCalender from "../../components/HeaderCalendar";

export default function Calendar() {
  const nav = useRouter();

  return (
    <View style={styles.container}>
      <HeaderCalender />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
});
