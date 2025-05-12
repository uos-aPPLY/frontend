// components/Modal/TextEditorModal.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import Modal from "react-native-modal";

export default function TextEditorModal({
  visible,
  initialText,
  onSave,
  onCancel,
  hintText = "",
}) {
  const [localText, setLocalText] = useState(initialText);

  useEffect(() => {
    setLocalText(initialText);
  }, [initialText]);

  const handleClose = () => {
    onSave(localText);
    onCancel();
  };

  return (
    <Modal
      isVisible={visible}
      swipeDirection="down"
      onSwipeComplete={handleClose}
      onBackdropPress={handleClose}
      style={styles.modal}
      avoidKeyboard
    >
      <View style={styles.content}>
        <View style={styles.handle} />
        {hintText ? <Text style={styles.hint}>{hintText}</Text> : null}
        <TextInput
          style={styles.input}
          multiline
          autoFocus
          value={localText}
          onChangeText={setLocalText}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  content: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "left",
    marginBottom: 5,
  },
  input: {
    minHeight: 100,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
});
