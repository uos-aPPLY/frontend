import { Text, View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { deletePhotoById } from "../utils/clearTempPhotos";
import { useAuth } from "../contexts/AuthContext";
import IconButton from "./IconButton";

export default function CardPicture({
  id,
  imageSource,
  isPlaceholder = false,
  onPress,
  showControls = false,
  onDelete,
  isMain = false,
  onPressMain,
}) {
  const { token } = useAuth();

  const handleDelete = async () => {
    await deletePhotoById(id, token);
    if (onDelete) onDelete(id);
  };

  return (
    <View style={styles.all}>
      <View style={styles.shadowWrapper}>
        <View style={styles.card}>
          {isPlaceholder ? (
            <IconButton
              source={require("../assets/icons/bigpinkplusicon.png")}
              wsize={50}
              hsize={50}
              onPress={onPress}
            />
          ) : (
            <>
              <Image source={{ uri: imageSource }} style={styles.image} />

              {showControls && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.badgeOverlay,
                      isMain ? styles.badgeActive : styles.badgeInactive,
                    ]}
                    onPress={() => onPressMain?.(id)}
                  >
                    <Text style={styles.badgeText}>대표 사진</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeWrapper}
                    onPress={handleDelete}
                  >
                    <Image
                      source={require("../assets/icons/xicon.png")}
                      style={styles.closeIconImg}
                    />
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
    paddingHorizontal: 30,
  },
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    resizeMode: "cover",
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff",
    borderWidth: 0.5,
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "#fff",
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  closeWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3.5,
    elevation: 5,
  },
  closeIconImg: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
});
