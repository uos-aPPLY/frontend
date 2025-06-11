import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal
} from "react-native";

const screenWidth = Dimensions.get("window").width;

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

        {/* 원본 사진 전체화면 모달 */}
        <Modal
          visible={!!fullscreenPhoto}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreenPhoto(null)}
        >
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.fullscreenOverlay}
              activeOpacity={1}
              onPress={() => setFullscreenPhoto(null)}
            >
              <TouchableOpacity activeOpacity={1}>
                <Image
                  source={{ uri: fullscreenPhoto?.photoUrl }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setFullscreenPhoto(null)}>
              <Image source={require("../assets/icons/xicon.png")} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>
        </Modal>
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

      {/* 원본 사진 전체화면 모달 */}
      <Modal
        visible={!!fullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenOverlay}
            activeOpacity={1}
            onPress={() => setFullscreenPhoto(null)}
          >
            <TouchableOpacity activeOpacity={1}>
              <Image
                source={{ uri: fullscreenPhoto?.photoUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={() => setFullscreenPhoto(null)}>
            <Image source={require("../assets/icons/xicon.png")} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>
      </Modal>
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
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
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
