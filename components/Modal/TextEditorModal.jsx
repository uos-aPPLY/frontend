// components/Modal/TextEditorModal.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Platform, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";

export default function TextEditorModal({ visible, initialText, onSave, onCancel, hintText = "" }) {
  const [localText, setLocalText] = useState(initialText);

  useEffect(() => {
    if (visible) {
      setLocalText(initialText);
    }
  }, [initialText, visible]);

  const handleAttemptSave = async () => {
    if (onSave) {
      const success = await onSave(localText);
      if (success) {
        onCancel();
      }
    }
  };

  const handleCancel = () => {
    setLocalText(initialText);
    onCancel();
  };

  return (
    <Modal
      isVisible={visible}
      swipeDirection="down"
      onSwipeComplete={handleCancel}
      onBackdropPress={handleCancel}
      style={styles.modal}
      avoidKeyboard
      onModalShow={() => setLocalText(initialText)}
    >
      <View style={styles.content}>
        <View style={styles.handle} />
        {hintText ? <Text style={styles.hint}>{hintText}</Text> : null}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            multiline
            autoFocus
            value={localText}
            onChangeText={setLocalText}
            placeholderTextColor="#c7c7cd"
          />
          <TouchableOpacity style={styles.confirmButton} onPress={handleAttemptSave}>
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0
  },
  content: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10
  },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "left",
    marginBottom: 5
  },
  inputContainer: {
    position: "relative",
    backgroundColor: "#f9f9f9",
    borderRadius: 20
  },
  input: {
    minHeight: 100,
    borderRadius: 20,
    padding: 15,
    fontSize: 14
  },
  confirmButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  }
});
