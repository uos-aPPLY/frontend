import { Text, Image, StyleSheet, View } from "react-native";
import IconButton from "./IconButton";
import {
  useFonts,
  HomemadeApple_400Regular,
} from "@expo-google-fonts/homemade-apple";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useRouter } from "expo-router";

// 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

const HeaderSearch = () => {
  const nav = useRouter();

  const [fontsLoaded] = useFonts({
    HomemadeApple_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // 로딩 중일 땐 아무것도 렌더링하지 않음
  }

  return (
    <View style={styles.all}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Image
            source={require("../assets/character/char2.png")}
            style={styles.char2}
          />
          <Text style={styles.logo}>DiaryPic</Text>
        </View>
        <View style={styles.right}>
          <IconButton
            source={require("../assets/icons/whitesearchicon.png")}
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

export default HeaderSearch;

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
  },
  container: {
    height: 114,
    width: "100%",
    backgroundColor: "#E3A7AD",
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  logo: {
    fontSize: 20,
    fontFamily: "HomemadeApple_400Regular",
    color: "#fff",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  char2: {
    width: 40,
    height: 38,
    marginRight: 15,
  },
});
