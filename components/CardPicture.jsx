import React from "react";
import { View, Image, StyleSheet } from "react-native";
import IconButton from "./IconButton";

export default function CardPicture({
  imageSource,
  isPlaceholder = false,
  onPress,
}) {
  return (
    <View style={styles.all}>
      <View style={styles.card}>
        {isPlaceholder ? (
          <IconButton
            source={require("../assets/icons/bigpinkplusicon.png")}
            wsize={50}
            hsize={50}
            onPress={onPress}
          />
        ) : (
          <Image source={{ uri: imageSource }} style={styles.image} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
    paddingHorizontal: 30,
  },
  card: {
    width: "100%",
    height: 313,
    backgroundColor: "#F1F2F1",
    marginTop: 30,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",

    // iOS 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    resizeMode: "cover",
  },
});
