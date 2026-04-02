import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import IconButton from "./IconButton";

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = screenWidth - 112;
const CARD_GAP = 14;
const SIDE_PADDING = (screenWidth - CARD_WIDTH) / 2;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export default function EditImageSlider({
  photos,
  mainPhotoId,
  setMainPhotoId,
  onDeletePhoto,
  onAddPhoto,
  currentIndex,
  setCurrentIndex,
  enableInlineReorder = false,
  onReorderPhotos
}) {
  const flatListRef = useRef(null);
  const placeholderIndexRef = useRef(currentIndex);
  const [isReordering, setIsReordering] = useState(false);

  const realPhotos = useMemo(() => photos.filter((p) => p.type !== "add"), [photos]);
  const isEmpty = realPhotos.length === 0;
  const canAddMore = realPhotos.length < 9;

  useEffect(() => {
    if (realPhotos.length === 0) {
      setMainPhotoId(null);
    }
    if (currentIndex > Math.max(realPhotos.length - 1, 0)) {
      setCurrentIndex(Math.max(realPhotos.length - 1, 0));
    }
  }, [currentIndex, realPhotos.length, setCurrentIndex, setMainPhotoId]);

  useEffect(() => {
    placeholderIndexRef.current = currentIndex;
  }, [currentIndex]);

  const scrollToPhoto = useCallback((index) => {
    flatListRef.current?.scrollToOffset?.({
      offset: Math.max(0, index * SNAP_INTERVAL),
      animated: true
    });
  }, []);

  const handleDragEnd = useCallback(
    ({ data, to }) => {
      setIsReordering(false);
      onReorderPhotos?.(data);

      const nextIndex = Math.max(0, Math.min(data.length - 1, to));
      setCurrentIndex(nextIndex);

      requestAnimationFrame(() => {
        scrollToPhoto(nextIndex);
      });
    },
    [onReorderPhotos, scrollToPhoto, setCurrentIndex]
  );

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      if (realPhotos.length === 0) {
        setCurrentIndex(0);
        return;
      }

      const rawIndex = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
      const clampedIndex = Math.max(0, Math.min(realPhotos.length - 1, rawIndex));
      setCurrentIndex(clampedIndex);
    },
    [realPhotos.length, setCurrentIndex]
  );

  const renderPhotoCard = useCallback(
    ({ item, drag, isActive, getIndex }) => {
      const itemIndex = getIndex?.() ?? 0;

      return (
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={
            enableInlineReorder
              ? () => {
                  setIsReordering(true);
                  placeholderIndexRef.current = itemIndex;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  drag();
                }
              : undefined
          }
          delayLongPress={260}
        >
          <View style={styles.cardContainer}>
            <View style={[styles.shadowCard, isActive && styles.activeShadowCard]}>
              <View style={styles.imageCard}>
                <Image source={{ uri: item.photoUrl }} style={styles.image} />
                <TouchableOpacity
                  style={[
                    styles.badgeOverlay,
                    String(item.id) === String(mainPhotoId)
                      ? styles.badgeActive
                      : styles.badgeInactive
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
          </View>
        </TouchableOpacity>
      );
    },
    [enableInlineReorder, mainPhotoId, onDeletePhoto, setCurrentIndex, setMainPhotoId]
  );

  const renderAddCard = () => (
    <View style={styles.addCardContainer}>
      <View style={styles.addCard}>
        <IconButton
          source={require("../assets/icons/bigpinkplusicon.png")}
          wsize={50}
          hsize={50}
          onPress={onAddPhoto}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {realPhotos.length > 0 && (
        <View style={styles.pageIndicator}>
          {realPhotos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id?.toString() ?? `photo-${index}`}
              onPress={() => {
                scrollToPhoto(index);
                setCurrentIndex(index);
              }}
              style={styles.indicatorItem}
            >
              {currentIndex === index ? (
                <Image source={{ uri: photo.photoUrl }} style={styles.thumbnail} />
              ) : (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isEmpty ? (
        <View style={styles.emptyWrapper}>{renderAddCard()}</View>
      ) : (
        <DraggableFlatList
          ref={flatListRef}
          data={realPhotos}
          keyExtractor={(item) => item.id?.toString() ?? `${item.photoUrl}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onDragBegin={(index) => {
            setIsReordering(true);
            placeholderIndexRef.current = index;
          }}
          onRelease={() => setIsReordering(false)}
          onPlaceholderIndexChange={(index) => {
            if (index == null || index < 0 || index === placeholderIndexRef.current) {
              return;
            }

            placeholderIndexRef.current = index;
            Haptics.selectionAsync().catch(() => {});
          }}
          onDragEnd={handleDragEnd}
          renderItem={renderPhotoCard}
          ListFooterComponent={canAddMore ? renderAddCard : null}
          contentContainerStyle={styles.listContent}
          activationDistance={18}
          snapToInterval={isReordering ? undefined : SNAP_INTERVAL}
          decelerationRate={isReordering ? "normal" : "fast"}
          snapToAlignment="start"
          autoscrollThreshold={32}
          autoscrollSpeed={90}
          dragItemOverflow
        />
      )}

      {enableInlineReorder && realPhotos.length > 1 ? (
        <Text style={styles.reorderHint}>
          {isReordering
            ? "좌우로 움직여 사진 순서를 바꿀 수 있어요."
            : "사진을 길게 눌러 좌우로 움직이면 순서를 바꿀 수 있어요."}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10
  },
  listContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 10,
    paddingBottom: 16
  },
  emptyWrapper: {
    paddingHorizontal: SIDE_PADDING
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    height: 22,
    marginTop: 5,
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
  thumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4
  },
  cardContainer: {
    position: "relative",
    width: CARD_WIDTH,
    aspectRatio: 1,
    marginRight: CARD_GAP,
    overflow: "visible"
  },
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    borderRadius: 20,
    overflow: "visible"
  },
  activeShadowCard: {
    transform: [{ scale: 1.03 }]
  },
  imageCard: {
    borderRadius: 20,
    overflow: "hidden"
  },
  image: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover"
  },
  addCardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP
  },
  addCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    zIndex: 10
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff"
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff"
  },
  badgeText: {
    fontSize: 12,
    color: "#fff"
  },
  closeWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff"
  },
  reorderHint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#A78C7B",
    paddingHorizontal: 36
  }
});
