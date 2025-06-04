// components/Header/HeaderSettings.jsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

const HEADER_HEIGHT = 50;
const ICON_CONTAINER_WIDTH = 40;

export default function HeaderSettings({ title, onBackPress, rightComponent, descriptionText }) {
  const router = useRouter();

  const handleGoBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButtonTouchable} onPress={handleGoBack}>
          <Image
            source={require("../../assets/icons/backicon.png")}
            style={styles.backIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitleText} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>

        {rightComponent ? (
          <View style={styles.rightActionWrapper}>{rightComponent}</View>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
      {descriptionText && <Text style={styles.headerDescriptionText}>{descriptionText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: 15
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    position: "relative"
  },
  backButtonTouchable: {
    width: ICON_CONTAINER_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-start"
  },
  backIconImage: {
    width: 12,
    height: 22
  },
  titleWrapper: {
    position: "absolute",
    left: ICON_CONTAINER_WIDTH + 5,
    right: ICON_CONTAINER_WIDTH + 5,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A78C7B",
    textAlign: "center"
  },
  headerDescriptionText: {
    fontSize: 12,
    color: "#B3A9A0",
    textAlign: "center",
    marginTop: -10
  },
  rightActionWrapper: {
    minWidth: ICON_CONTAINER_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end"
  },
  rightPlaceholder: {
    width: ICON_CONTAINER_WIDTH,
    height: "100%"
  }
});
