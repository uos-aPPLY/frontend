import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import colors from "../constants/colors";

const SIZE = Dimensions.get("window").width / 3;

export default function ImageItem({ asset, selected, onPress, onLongPress, onLayout }) {
  if (!asset || !asset.uri) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.imageWrapper}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
    >
      <Image source={{ uri: asset.uri }} style={[styles.image, selected && styles.selectedImage]} />

      {selected && (
        <View style={styles.checkIconWrapper}>
          <Image source={require("../assets/icons/pinkcheckicon.png")} style={styles.checkIcon} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    width: SIZE,
    height: SIZE,
    position: "relative"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  selectedImage: {
    opacity: 0.6
  },
  checkIconWrapper: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 11,
    padding: 2
  },
  checkIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain"
  }
});
