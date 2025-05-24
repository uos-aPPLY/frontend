// components/CheckBox.jsx
import { Image, TouchableOpacity, StyleSheet } from "react-native";

const CheckBox = ({ value, onValueChange, style, size = 26 }) => (
  <TouchableOpacity onPress={() => onValueChange(!value)} style={style}>
    <Image
      source={
        value
          ? require("../assets/icons/pinkcheckicon.png")
          : require("../assets/icons/graycheckicon.png")
      }
      style={[
        styles.checkbox,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  checkbox: {
    marginRight: 18,
    resizeMode: "contain",
  },
});

export default CheckBox;
