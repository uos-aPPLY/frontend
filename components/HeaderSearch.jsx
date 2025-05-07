// src/components/HeaderSearch.jsx
import { Image, StyleSheet, TextInput, View } from "react-native";
import IconButton from "./IconButton";

const HeaderSearch = ({ value, onChangeText, onBack }) => {
  return (
    <View style={styles.all}>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Image
            source={require("../assets/icons/brownsearchicon.png")}
            style={styles.searchIcon}
          />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.input}
            cursorColor="#AC8B78"
            autoFocus
          />
        </View>
        <View style={{ marginLeft: 15 }}>
          <IconButton
            source={require("../assets/icons/xicon.png")}
            hsize={17}
            wsize={17}
            onPress={onBack}
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
    paddingTop: 45,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  searchIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    fontSize: 16,
    outlineStyle: "none",
  },
});
