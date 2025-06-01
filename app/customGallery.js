// CustomGalleryScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { uploadPhotos } from "../utils/uploadPhotos";
import DragSelectableGrid from "../components/DragSelectableGrid";
import { useAuth } from "../contexts/AuthContext";
import { useDiary } from "../contexts/DiaryContext";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import colors from "../constants/colors";

export default function CustomGalleryScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { selectedDate } = useDiary();
  const { mode } = usePhoto(); // "choose" 또는 "recommend"

  const MAX_SELECTION = mode === "choose" ? 9 : 160; // ✅ 선택 제한 분기

  const [allPhotos, setAllPhotos] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return;
    }

    const media = await MediaLibrary.getAssetsAsync({
      mediaType: "photo",
      first: 100,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      after: endCursor || undefined
    });

    setAllPhotos((prev) => [...prev, ...media.assets]);
    setHasNextPage(media.hasNextPage);
    setEndCursor(media.endCursor);
    setLoading(false);
  };

  const toggleSelect = useCallback(
    (asset) => {
      const exists = selectedAssets.find((a) => a.id === asset.id);
      if (exists) {
        setSelectedAssets((prev) => prev.filter((a) => a.id !== asset.id));
      } else {
        if (selectedAssets.length >= MAX_SELECTION) {
          Alert.alert("선택 제한", `${MAX_SELECTION}장까지 선택 가능합니다.`);
          return;
        }
        setSelectedAssets((prev) => [...prev, asset]);
      }
    },
    [selectedAssets, MAX_SELECTION]
  );

  const handleUpload = async () => {
    if (!token) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    if (selectedAssets.length === 0) {
      Alert.alert("선택 필요", "업로드할 사진을 선택하세요.");
      return;
    }

    setUploading(true);
    try {
      const resizedAssets = await Promise.all(
        selectedAssets.map((asset) =>
          ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 400 } }], {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG
          })
        )
      );

      await uploadPhotos(resizedAssets, token, selectedAssets);
      navigation.navigate("confirmPhoto");
    } catch (error) {
      console.error("업로드 실패", error);
      Alert.alert("오류", "사진 업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pinkpoint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          onPress={() => navigation.goBack()}
          wsize={22}
          hsize={22}
        />
        <Text style={styles.headerText}>
          {mode === "choose" ? "직접 사진 선택(9장)" : "베스트샷 추천 받기"}
        </Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.modeInfo}>
        <Text style={styles.modeText}>
          {mode === "choose"
            ? "9장까지 선택할 수 있어요."
            : "베스트샷 기능을 통해서 9장이 선택돼요."}
        </Text>
      </View>

      <View style={styles.container}>
        {selectedAssets.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedAssets.length}장 선택됨</Text>
            <TouchableOpacity
              onPress={() => {
                setMultiSelectMode(false);
                setSelectedAssets([]);
              }}
            >
              <Text style={styles.clearText}>선택 해제</Text>
            </TouchableOpacity>
          </View>
        )}

        <DragSelectableGrid
          assets={allPhotos}
          selectedAssets={selectedAssets}
          onSelect={toggleSelect}
          multiSelectMode={multiSelectMode}
          onLongPressActivate={() => setMultiSelectMode(true)}
          selectedDate={selectedDate}
        />
      </View>
      <View style={styles.buttonWrapper}>
        {mode === "choose" ? (
          <View style={styles.horizontalButtons}>
            <TouchableOpacity
              style={styles.commonButton}
              onPress={() => navigation.navigate("manualWrite")}
            >
              <Text style={styles.commonButtonText}>직접 쓰기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commonButton} onPress={handleUpload}>
              <Text style={styles.commonButtonText}>AI 생성 일기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.fullWidthButton} onPress={handleUpload}>
            <Text style={styles.commonButtonText}>다음</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgorund,
    paddingTop: 75
  },
  container: {
    flex: 1,
    paddingBottom: 100
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30
  },
  headerText: {
    fontSize: 18,
    color: "#a78c7b",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  modeInfo: {
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  modeText: {
    fontSize: 14,
    color: "#a78c7b",
    textAlign: "center",
    marginTop: 5
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderBottomColor: "#ddd",
    borderBottomWidth: 1
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark
  },
  clearText: {
    fontSize: 14,
    color: colors.pinkpoint,
    fontWeight: "500"
  },
  buttonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "transparent" //
  },
  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12 // 또는 marginHorizontal 사용
  },
  commonButton: {
    backgroundColor: colors.pinkmain,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center"
  },
  commonButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500"
  },
  fullWidthButton: {
    backgroundColor: colors.pinkmain,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center"
  }
});
