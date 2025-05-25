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
    backgroundColor: "#fff",
    color: "#A78C7B",
    fontSize: 16,
    lineHeight: 26,
    paddingVertical: 17,
    paddingHorizontal: 25,
    borderRadius: 30,
    minHeight: 360,
    marginBottom: 40,
  },
});
