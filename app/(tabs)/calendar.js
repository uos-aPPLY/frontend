import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import HeaderCalender from "../../components/Header/HeaderCalendar";

export default function Calendar() {
  const nav = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderCalender />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingHorizontal: 15,
  },
});
