import { Text, Image, StyleSheet, View } from "react-native";
import IconButton from "../IconButton";
import { useFonts, HomemadeApple_400Regular } from "@expo-google-fonts/homemade-apple";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useRouter } from "expo-router";

SplashScreen.preventAutoHideAsync();

const HeaderDefault = () => {
  const nav = useRouter();

  const [fontsLoaded] = useFonts({
    HomemadeApple_400Regular
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.all}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Image source={require("../../assets/character/char2.png")} style={styles.char2} />
          <Text style={styles.logo}>DiaryPic</Text>
        </View>
        <View style={styles.right}>
          <IconButton
            source={require("../../assets/icons/whitesearchicon.png")}
            wsize={23}
            hsize={22}
            onPress={() => {
              nav.push("/search?from=main");
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default HeaderDefault;

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4"
  },
  container: {
    height: 130,
    width: "100%",
    backgroundColor: "#E3A7AD",
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  logo: {
    fontSize: 22,
    fontFamily: "HomemadeApple_400Regular",
    color: "#fff",
    marginBottom: -8
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  char2: {
    width: 44,
    height: 40,
    resizeMode: "contain",
    marginRight: 10,
    marginLeft: 1,
    marginTop: 8
  }
});
