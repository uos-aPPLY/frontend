import { TextInput, StyleSheet } from "react-native";
import React, { forwardRef } from "react";

const TextBox = forwardRef(function TextBox(
  { value, onChangeText, placeholder, onFocus, onBlur },
  ref
) {
  return (
    <TextInput
      ref={ref}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
      onFocus={onFocus}
      onBlur={onBlur}
      textAlignVertical="top"
    />
  );
});

export default TextBox;

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
    marginBottom: 40
  },
});
