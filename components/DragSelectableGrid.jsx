// DragSelectableGrid.jsx

import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder
} from "react-native";
import ImageItem from "./ImageItem";
import colors from "../constants/colors";
import { inter400Regular } from "@expo-google-fonts/inter";

const SIZE = Dimensions.get("window").width / 3;

export default function DragSelectableGrid({
  assets,
  selectedAssets,
  onSelect,
  multiSelectMode,
  onLongPressActivate,
  selectedDate,
  mode
}) {
  const layoutMap = useRef({});
  const selectedDuringDrag = useRef(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const isSameDate = (timestamp, dateObj) => {
    if (!timestamp || !dateObj) return false;
    const d1 = new Date(timestamp);
    const d2 = typeof dateObj === "string" ? new Date(dateObj) : dateObj;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDateToString = (date) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const selectedDatePhotoIds = useMemo(
    () =>
      assets
        .filter((asset) => asset.creationTime && isSameDate(asset.creationTime, selectedDate))
        .map((item) => item.id),
    [assets, selectedDate]
  );

  const selectedDatePhotos = useMemo(
    () =>
      assets
        .filter((asset) => selectedDatePhotoIds.includes(asset.id))
        .map((item) => ({ ...item, type: "selected" })),
    [assets, selectedDatePhotoIds]
  );

  const otherPhotos = useMemo(() => {
    return assets
      .filter((asset) => !selectedDatePhotoIds.includes(asset.id))
      .map((item) => ({ ...item, type: "normal" }));
  }, [assets, selectedDatePhotoIds]);

  const handleLayout = (id, e) => {
    layoutMap.current[id] = e.nativeEvent.layout;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => multiSelectMode,
      onPanResponderGrant: () => {
        setIsDragging(true);
        selectedDuringDrag.current.clear();
      },
      onPanResponderMove: (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        for (const asset of otherPhotos) {
          const layout = layoutMap.current[asset.id];
          if (!layout || selectedDuringDrag.current.has(asset.id)) continue;

          const inBounds =
            moveX >= layout.x &&
            moveX <= layout.x + layout.width &&
            moveY >= layout.y &&
            moveY <= layout.y + layout.height;

          if (inBounds) {
            selectedDuringDrag.current.add(asset.id);
            onSelect(asset);
          }
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        selectedDuringDrag.current.clear();
      }
    })
  ).current;

  const renderItem = ({ item }) => {
    if (item.type === "dummy") return <View style={styles.dummyBox} />;
    return (
      <ImageItem
        asset={item}
        selected={!!selectedAssets.find((a) => a.id === item.id)}
        onPress={() => onSelect(item)}
        onLongPress={() => {
          onLongPressActivate();
          onSelect(item);
        }}
        onLayout={(e) => handleLayout(item.id, e)}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView scrollEnabled={!isDragging}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{formatDateToString(selectedDate)}의 순간들</Text>
          {selectedDatePhotos.length > 0 && mode !== "choose" && (
            <Text
              style={styles.selectAllButton}
              onPress={() => {
                selectedDatePhotos.forEach((photo) => onSelect(photo));
              }}
            >
              전체 선택
            </Text>
          )}
        </View>

        {selectedDatePhotos.length === 0 ? (
          <Text style={styles.noPhotosText}>해당 날짜에 찍은 사진이 없습니다.</Text>
        ) : (
          <FlatList
            data={selectedDatePhotos}
            numColumns={3}
            keyExtractor={(item) => `${item.id}-${item.type}`} // ✅ 수정된 key
            scrollEnabled={false}
            renderItem={renderItem}
            extraData={selectedAssets}
          />
        )}

        <View style={styles.separatorLabelWrapper}>
          <Text style={styles.separatorLabel}>전체 사진</Text>
        </View>

        <FlatList
          data={otherPhotos}
          numColumns={3}
          keyExtractor={(item) => `${item.id}-${item.type}`} // ✅ 수정된 key
          scrollEnabled={false}
          renderItem={renderItem}
          extraData={selectedAssets}
        />
      </ScrollView>

      {multiSelectMode && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-only"
          {...panResponder.panHandlers}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: inter400Regular,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 16,
    color: colors.brown
  },
  selectAllButton: {
    fontSize: 14,
    color: colors.brown,
    fontWeight: "400",
    paddingHorizontal: 8
  },
  separatorLabelWrapper: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background
  },
  separatorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.brown,
    paddingVertical: 8
  },
  dummyBox: {
    width: SIZE,
    height: SIZE,
    backgroundColor: colors.background
  },
  noPhotosText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 20
  }
});
