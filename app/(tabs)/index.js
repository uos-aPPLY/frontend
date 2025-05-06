import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import HeaderDefault from "../../components/HeaderDefault";
import IconButton from "../../components/IconButton";


export default function Home() {
  const nav = useRouter();

  return (
    <>
    <HeaderDefault>
    </HeaderDefault>
    <View style ={styles.container}>
        <View style={styles.card}>
          <IconButton
            source={require('../../assets/icons/bigpinkplusicon.png')}
            hsize={50}
            wsize={50}
            onPress={() => nav.push('/create?date=' + new Date().toISOString().slice(0, 10))}
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
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    // iOS 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

    // Android 그림자
    elevation: 3,
  },
});
