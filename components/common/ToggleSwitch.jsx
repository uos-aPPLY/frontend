// components/ToggleSwitch.jsx
import React, { useState } from "react";
import { Pressable, Image, StyleSheet } from "react-native";

export default function ToggleSwitch({
  onImage,
  offImage,
  style,
  onToggle,
  initialState = false,
}) {
  const [isOn, setIsOn] = useState(initialState);

  const handlePress = () => {
    const next = !isOn;
    setIsOn(next);
    onToggle?.(next);
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <Image source={isOn ? onImage : offImage} style={[styles.image, style]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingHorizontal: 4,
  },
  image: {
    width: 30,
    height: 20,
    resizeMode: "contain",
  },
});
