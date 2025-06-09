// components/Settings/Withdrawal.jsx
import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../Modal/ConfirmModal";

export default function Withdrawal({ style, textStyle, onWithdrawalSuccess }) {
  const router = useRouter();
  const { signOut, token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const authHeader = (t) => ({ Authorization: `Bearer ${t}` });

  const handleConfirm = async () => {
    try {
      const res = await fetch(`${Constants.expoConfig.extra.BACKEND_URL}/api/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(token)
        }
      });
      if (!res.ok) throw new Error("Failed to withdraw");

      if (onWithdrawalSuccess) {
        onWithdrawalSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalVisible(false);
    }
  };

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        title="정말로 탈퇴하시겠어요?"
        message="작성된 일기가 모두 삭제되고 복구가 불가능해요."
        onCancel={() => setModalVisible(false)}
        onConfirm={handleConfirm}
        confirmText="회원탈퇴"
      />

      <Pressable
        style={[styles.button, style]}
        onPress={() => setModalVisible(true)}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
      >
        {({ pressed }) => (
          <Text style={[styles.text, textStyle, pressed && { opacity: 0.5 }]}>회원탈퇴</Text>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#A78C7B",
    alignItems: "left"
  },
  text: {
    fontSize: 16,
    color: "#A78C78"
  }
});
