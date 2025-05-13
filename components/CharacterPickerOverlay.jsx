// components/CharacterPickerOverlay.js
import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { formatGridData } from "../utils/formatGridData";

export default function CharacterPickerOverlay({
  visible,
  characterList,
  onSelect,
}) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {formatGridData(characterList, 3).map((char, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            if (char) onSelect(char);
          }}
          disabled={!char}
        >
          {char ? (
            <Image source={char.source} style={styles.characterIcon} />
          ) : (
            <View style={[styles.characterIcon, { opacity: 0 }]} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  characterIcon: {
    width: 64,
    height: 62,
    margin: 20,
  },
});
