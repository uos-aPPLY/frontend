import React from "react";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function DiaryImageSlider({
  photos = [],
  isGridView,
  currentIndex,
  setCurrentIndex,
  flatListRef,
}) {
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
      <View style={styles.gridContainer}>
        {formatPhotosInRows(photos).map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((photo, colIndex) =>
              photo ? (
                <Image
                  key={colIndex}
                  source={{ uri: photo.photoUrl }}
                  style={styles.gridImage}
                />
              ) : (
                <View key={colIndex} style={styles.gridImage} />
              )
            )}
          </View>
        ))}
      </View>
    );
  }

  return (
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
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.thumbnailImage}
              />
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
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
          }
        }}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <Image source={{ uri: item.photoUrl }} style={styles.image} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    height: 22,
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
  thumbnailImage: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: 30,
  },
  gridContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridImage: {
    width: (screenWidth - 60) / 3,
    height: (screenWidth - 60) / 3,
    backgroundColor: "#EEE",
    borderRadius: 6,
  },
});
