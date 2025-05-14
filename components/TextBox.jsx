import { TextInput, StyleSheet } from "react-native";
import React from "react";

export default function TextBox({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 360,
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 30,
    lineHeight: 26,
    paddingVertical: 15,
    paddingHorizontal: 25,
    fontSize: 16,
    color: "#AC8B78",
    textAlignVertical: "top",
    outlineStyle: "none",
  },
});
