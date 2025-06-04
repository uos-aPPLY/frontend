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
import { useRouter } from "expo-router";
import DragSelectableGrid from "../components/DragSelectableGrid";
import { useAuth } from "../contexts/AuthContext";
import { useDiary } from "../contexts/DiaryContext";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import colors from "../constants/colors";
import ConfirmModal from "../components/Modal/ConfirmModal";
import { clearAllTempPhotos } from "../utils/clearTempPhotos";

export default function CustomGalleryScreen() {
  const { token } = useAuth();
  const nav = useRouter();
  const { selectedDate } = useDiary();
  const {
    mode,
    setMode,
    setPhotoList,
    setTempPhotoList,
    photoCount,
    selectedAssets,
    setSelectedAssets,
    setClear
  } = usePhoto();
  const MAX_SELECTION = mode === "add" ? 9 - photoCount : mode === "choose" ? 9 : 160;

  const [allPhotos, setAllPhotos] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (token) {
          // await clearAllTempPhotos(token);
          // console.log("🧹 임시 사진 초기화 완료");
        }
      } catch (e) {
        console.warn("⚠️ clearAllTempPhotos 실패:", e);
      }
      fetchPhotos(); // 기존 로딩 함수
    };

    init();
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
      return false;
    }

    if (selectedAssets.length === 0) {
      Alert.alert("선택 필요", "최소 1장의 사진을 선택해주세요.");
      return false;
    }

    return true;
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
          onPress={() => {
            setSelectedAssets([]);

            const formattedDate = selectedDate.toISOString().split("T")[0];

            nav.push({
              pathname: "/create",
              params: { date: formattedDate }
            });
          }}
          wsize={22}
          hsize={22}
        />

        <Text style={styles.headerText}>
          {mode === "choose"
            ? "직접 사진 선택(9장)"
            : mode === "add"
            ? "사진 추가"
            : "베스트샷 추천 받기"}
        </Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.modeInfo}>
        <Text style={styles.modeText}>
          {mode === "choose"
            ? "9장까지 선택할 수 있어요."
            : mode === "add"
            ? "일기에는 최대 9장의 사진을 추가할 수 있어요."
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
          mode={mode}
        />
      </View>
      <View style={styles.footerWrapper}>
        {mode === "add" ? (
          <TouchableOpacity
            style={styles.singleButtonWrapper}
            onPress={() => {
              const formatted = selectedAssets.map((asset) => ({
                id: asset.id,
                photoUrl: asset.uri
              }));
              setPhotoList((prev) => [...prev, ...formatted]);
              setTempPhotoList((prev) => [...prev, ...formatted]);
              nav.back();
            }}
          >
            <Text style={styles.commonButtonText}>사진 추가</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.doubleButtonWrapper}>
            {mode === "choose" ? (
              <>
                <TouchableOpacity
                  style={styles.commonButton}
                  onPress={async () => {
                    const success = await handleUpload();
                    if (success) {
                      nav.push("/loading/loadingWrite");
                    }
                  }}
                >
                  <Text style={styles.commonButtonText}>직접 쓰기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.commonButton}
                  onPress={async () => {
                    const success = await handleUpload();
                    if (success) {
                      nav.push("/loading/loadingPicture");
                    }
                  }}
                >
                  <Text style={styles.commonButtonText}>AI 생성 일기</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.commonButton}
                  onPress={async () => {
                    const success = await handleUpload();
                    if (!success) return;

                    if (selectedAssets.length < 10) {
                      setModalVisible(true);
                      return;
                    }

                    nav.push("/loading/loadingBestShot");
                  }}
                >
                  <Text style={styles.commonButtonText}>베스트샷 추천</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commonButton}
                  onPress={async () => {
                    const success = await handleUpload();
                    if (!success) return;

                    if (selectedAssets.length < 10) {
                      setModalVisible(true);
                      return;
                    }
                    setClear(true);
                    setMode("bestshot");
                    nav.push("/loading/loadingPicture");
                  }}
                >
                  <Text style={styles.commonButtonText}>필수 사진 선택</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
      <ConfirmModal
        visible={modalVisible}
        title="사진이 부족해요(9장 이상 필요)."
        message={"아니면 베스트샷 추천을 포기하고\n바로 일기를 작성하시겠어요?"}
        cancelText="취소"
        confirmText="포기 및 작성"
        onCancel={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false);
          setMode("choose");
          nav.push("/customGallery");
        }}
      />
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
  footerWrapper: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 10,
    backgroundColor: "transparent"
  },
  singleButtonWrapper: {
    backgroundColor: colors.pinkpoint,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "center"
  },
  doubleButtonWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  commonButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.pinkpoint,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  commonButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold"
  }
});
