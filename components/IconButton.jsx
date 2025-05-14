import { Image, TouchableOpacity, StyleSheet } from "react-native";

const IconButton = ({ source, onPress, wsize = 24, hsize = 24, style }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { width: wsize, height: hsize }, style]}
    >
      <Image
        source={source}
        style={{ width: wsize, height: hsize }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default IconButton;

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    outlineStyle: "none",
  },
});
