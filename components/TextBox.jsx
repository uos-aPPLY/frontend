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
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        fontSize: 14,
        color: '#AC8B78',
        textAlignVertical: 'top', // 안드로이드에서 세로 정렬
        outlineStyle: 'none',
    },
});
