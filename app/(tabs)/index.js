import { Text, View, StyleSheet } from "react-native";
import HeaderDefault from "../../src/components/HeaderDefault";
import HeaderSearch from "../../src/components/HeaderSearch";
import IconButton from "../../src/components/IconButton";


export default function Home() {
  return (
    <>
    <HeaderDefault>
    </HeaderDefault>
    <View style ={styles.container}>
        <View style={styles.card}>
          <IconButton
            source={require('../../assets/icons/bigpinkplusicon.png')}
            size={50}
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
