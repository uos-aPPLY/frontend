// components/ConfirmModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = "취소",
  confirmText = "확인",
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              activeOpacity={0.7}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingTop: 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#626262",
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#D9D9D9",
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: "#D68089",
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    color: "#333",
  },
  confirmText: {
    color: "#fff",
  },
});
