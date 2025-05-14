import React, { useRef } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from "react-native";
import IconButton from "./IconButton";

const screenWidth = Dimensions.get("window").width;

export default function EditImageSlider({
  photos,
  mainPhotoId,
  setMainPhotoId,
  onDeletePhoto,
  onAddPhoto,
  currentIndex,
  setCurrentIndex,
}) {
  const flatListRef = useRef(null);

  // ✅ 진짜 사진만 추림 (인디케이터 용도)
  const realPhotos = photos.filter((p) => p.type !== "add");

  return (
    <View style={styles.wrapper}>
      {/* ✅ Indicator - 진짜 사진만 */}
      <View style={styles.pageIndicator}>
        {realPhotos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
              setCurrentIndex(index);
            }}
            style={styles.indicatorItem}
          >
            {currentIndex === index ? (
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.thumbnail}
              />
            ) : (
              <View style={styles.dot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ✅ FlatList - 전체 사진 (add 포함) */}
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) =>
          item.type === "add" ? (
            <View style={styles.cardContainer}>
              <View style={styles.addCard}>
                <IconButton
                  source={require("../assets/icons/bigpinkplusicon.png")}
                  wsize={50}
                  hsize={50}
                  onPress={onAddPhoto}
                />
              </View>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              <View style={styles.shadowCard}>
                <Image source={{ uri: item.photoUrl }} style={styles.image} />
                <TouchableOpacity
                  style={[
                    styles.badgeOverlay,
                    String(item.id) === String(mainPhotoId)
                      ? styles.badgeActive
                      : styles.badgeInactive,
                  ]}
                  onPress={() => setMainPhotoId(String(item.id))}
                >
                  <Text style={styles.badgeText}>대표 사진</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeWrapper}
                  onPress={() => onDeletePhoto(item.id)}
                >
                  <Image
                    source={require("../assets/icons/xicon.png")}
                    style={styles.closeIconImg}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 22,
    marginTop: 5,
    marginBottom: 10,
  },
  indicatorItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
  },
  thumbnail: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  cardContainer: {
    position: "relative",
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 30,
  },
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
  },
  addCard: {
    marginTop: 10,
    width: screenWidth - 60,
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    zIndex: 10,
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff",
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  closeWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
});
