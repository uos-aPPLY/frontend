import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

function ZoomableImageModal({ photo, onClose }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [photo, savedScale, scale, savedTranslateX, savedTranslateY, translateX, translateY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(nextScale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
        return;
      }

      const maxOffset = ((screenWidth * 0.95) * (scale.value - 1)) / 2;
      const nextX = savedTranslateX.value + event.translationX;
      const nextY = savedTranslateY.value + event.translationY;

      translateX.value = Math.max(-maxOffset, Math.min(maxOffset, nextX));
      translateY.value = Math.max(-maxOffset, Math.min(maxOffset, nextY));
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }]
  }));

  return (
    <Modal visible={!!photo} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fullscreenContainer}>
        <Pressable style={styles.fullscreenOverlay} onPress={onClose} />

        <View style={styles.fullscreenContent}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={animatedImageStyle}>
              <Image
                source={{ uri: photo?.photoUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Image source={require("../../assets/icons/xicon.png")} style={styles.closeIcon} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function DiaryImageSlider({
  photos = [],
  isGridView,
  currentIndex,
  setCurrentIndex,
  flatListRef
}) {
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const formatPhotosInRows = (photos, columns = 3) => {
    const rows = [];
    const photoCopy = [...photos];
    while (photoCopy.length > 0) {
      const row = photoCopy.splice(0, columns);
      while (row.length < columns) {
        row.push(null);
      }
      rows.push(row);
    }
    return rows;
  };

  if (isGridView) {
    return (
      <>
        <View style={styles.gridContainer}>
          {formatPhotosInRows(photos).map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((photo, colIndex) =>
                photo ? (
                  <TouchableOpacity key={colIndex} onPress={() => setFullscreenPhoto(photo)}>
                    <Image source={{ uri: photo.photoUrl }} style={styles.gridImage} />
                  </TouchableOpacity>
                ) : (
                  <View key={colIndex} style={styles.gridImage} />
                )
              )}
            </View>
          ))}
        </View>

        <ZoomableImageModal photo={fullscreenPhoto} onClose={() => setFullscreenPhoto(null)} />
      </>
    );
  }

  return (
    <>
      <View style={styles.sliderContainer}>
        <View style={styles.pageIndicator}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                flatListRef?.current?.scrollToIndex({ index, animated: true });
                setCurrentIndex(index);
              }}
              style={styles.indicatorItem}
            >
              {currentIndex === index ? (
                <Image source={{ uri: photo.photoUrl }} style={styles.thumbnailImage} />
              ) : (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => {
            setTimeout(() => setIsScrolling(false), 100);
          }}
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems.length > 0) {
              setCurrentIndex(viewableItems[0].index);
            }
          }}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (!isScrolling) {
                  setFullscreenPhoto(item);
                }
              }}
              delayPressIn={100}
            >
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
            </TouchableOpacity>
          )}
        />
      </View>

      <ZoomableImageModal photo={fullscreenPhoto} onClose={() => setFullscreenPhoto(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    alignItems: "center",
    marginTop: 5
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    height: 22,
    marginBottom: 10
  },
  indicatorItem: {
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#D9D9D9"
  },
  thumbnailImage: {
    width: 24,
    height: 24,
    borderRadius: 4
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: 30
  },
  gridContainer: {
    paddingHorizontal: 30,
    marginTop: 10
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  gridImage: {
    width: (screenWidth - 60) / 3,
    height: (screenWidth - 60) / 3,
    backgroundColor: "#EEE",
    borderRadius: 6
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center"
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  fullscreenContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12
  },
  fullscreenImage: {
    width: screenWidth * 0.95,
    height: screenWidth * 0.95,
    maxWidth: 400,
    maxHeight: 400
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 10
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff"
  }
});
