// screens/AddPhotoGalleryScreen.jsx
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
import { useRouter } from "expo-router";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import DragSelectableGrid from "../components/DragSelectableGrid";
import colors from "../constants/colors";
import { uploadPhotos } from "../utils/uploadPhotos";
import { useAuth } from "../contexts/AuthContext";

export default function AddPhotoGalleryScreen() {
  const nav = useRouter();
  const { token } = useAuth();
  const { setPhotoList, setTempPhotoList, selectedAssets, setSelectedAssets, photoCount } =
    usePhoto();

  const MAX_SELECTION = 9 - photoCount;

  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [endCursor, setEndCursor] = useState(null);

  useEffect(() => {
    setSelectedAssets([]);
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
          Alert.alert("선택 제한", `${MAX_SELECTION}장까지 추가할 수 있어요.`);
          return;
        }
        setSelectedAssets((prev) => [...prev, asset]);
      }
    },
    [selectedAssets, MAX_SELECTION]
  );

  const handleAddPhoto = async () => {
    if (!token || selectedAssets.length === 0) return;

    try {
      setLoading(true);

      const resolvedAssets = await Promise.all(
        selectedAssets.map(async (asset) => {
          const info = await MediaLibrary.getAssetInfoAsync(asset.id);
          return {
            ...asset,
            uri: info.localUri || asset.uri
          };
        })
      );

      const uploaded = await uploadPhotos(resolvedAssets, token, selectedAssets);

      if (!uploaded || uploaded.length === 0) {
        Alert.alert("업로드 실패", "사진 업로드에 실패했습니다.");
        return;
      }

      const formatted = uploaded.map((p) => ({
        id: p.id,
        photoUrl: p.photoUrl
      }));

      setPhotoList((prev) => [...prev, ...formatted]);
      setTempPhotoList((prev) => [...prev, ...formatted]);
      setSelectedAssets([]);
      nav.back();
    } catch (err) {
      console.error("📤 사진 업로드 오류:", err);
      Alert.alert("오류", "사진 업로드 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pinkpoint} />
          <Text style={styles.loadingText}>사진 업로드 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          onPress={() => {
            setSelectedAssets([]);
            nav.back();
          }}
          wsize={22}
          hsize={22}
        />
        <Text style={styles.headerText}>사진 추가</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.modeInfo}>
        <Text style={styles.modeText}>일기에는 최대 9장의 사진을 추가할 수 있어요.</Text>
      </View>

      <View style={styles.container}>
        {selectedAssets.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedAssets.length}장 선택됨</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedAssets([]);
                setMultiSelectMode(false);
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
          selectedDate={null}
          mode="add"
        />
      </View>

      <View style={styles.footerWrapper}>
        <TouchableOpacity style={styles.singleButtonWrapper} onPress={handleAddPhoto}>
          <Text style={styles.commonButtonText}>사진 추가</Text>
        </TouchableOpacity>
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
    flex: 1
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
  footerWrapper: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 10
  },
  singleButtonWrapper: {
    backgroundColor: colors.pinkpoint,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "center"
  },
  commonButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold"
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
