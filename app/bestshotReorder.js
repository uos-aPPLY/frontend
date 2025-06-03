import { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import ConfirmModal from "../components/Modal/ConfirmModal";

const screenWidth = Dimensions.get("window").width;

export default function BestShotReorder() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const {
    photoList,
    setPhotoList,
    setTempPhotoList,
    selected,
    setSelected,
    mainPhotoId,
    setMainPhotoId,
    setSelectedAssets
  } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [mainPhotoIdLocal, setMainPhotoIdLocal] = useState(null);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [targetPhotoId, setTargetPhotoId] = useState(null);

  // ✅ selected ID 기반 필터링
  const effectivePhotos = useMemo(() => {
    if (!selected || selected.length === 0) return [];

    const selectedIds = selected.map((s) => String(s?.id || s));
    return photoList.filter((p) => selectedIds.includes(String(p.id)));
  }, [photoList, selected]);

  const visiblePhotos = useMemo(
    () => photos.filter((p) => !hiddenIds.includes(p.id)),
    [photos, hiddenIds]
  );

  useEffect(() => {
    setPhotos(effectivePhotos);
    const fallbackMain =
      effectivePhotos.find((p) => String(p.id) === String(mainPhotoId)) || effectivePhotos[0];
    setMainPhotoIdLocal(fallbackMain?.id ?? null);
  }, [effectivePhotos, mainPhotoId]);

  useEffect(() => {
    if (hiddenIds.includes(mainPhotoIdLocal)) {
      const firstVisible = photos.filter((p) => !hiddenIds.includes(p.id))[0];
      if (firstVisible) {
        setMainPhotoIdLocal(firstVisible.id);
      } else {
        setMainPhotoIdLocal(null); // 아무것도 없을 경우
      }
    }
  }, [hiddenIds, photos]);

  const handleSaveAndNavigate = (mode) => {
    const newOrder = photos.filter((p) => !hiddenIds.includes(p.id));
    const newIds = newOrder.map((p) => String(p.id));

    setSelected(newIds);
    setPhotoList(newOrder);
    setTempPhotoList(null);
    setMainPhotoId(mainPhotoIdLocal);
    setSelectedAssets([]); // 선택된 자산 초기화

    router.push(mode === "manual" ? "/write" : "/generate");
  };

  const handleBack = () => {
    setTempPhotoList(null);
    router.back();
  };

  const handleHidePhoto = (id) => {
    setTargetPhotoId(id);
    setIsConfirmVisible(true);
  };

  const onConfirmDelete = () => {
    if (targetPhotoId) {
      setHiddenIds((prev) => [...prev, targetPhotoId]);
      setTargetPhotoId(null);
      setIsConfirmVisible(false);
    }
  };

  const onCancelDelete = () => {
    setTargetPhotoId(null);
    setIsConfirmVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={handleBack}
        />
        <Text style={styles.title}>베스트샷 선정 결과</Text>
        <View style={{ width: 22 }} />
      </View>

      <DraggableFlatList
        ref={flatListRef}
        data={visiblePhotos}
        keyExtractor={(item) => item.id.toString()}
        onDragEnd={({ data }) => setPhotos(data)}
        activationDelay={200}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <View style={styles.cardWrapper}>
              <View style={styles.cardShadowWrapper}>
                <TouchableOpacity onPressIn={drag} activeOpacity={1}>
                  <View style={[styles.card, isActive && { opacity: 0.8 }]}>
                    <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={[
                        styles.badgeOverlay,
                        String(item.id) === String(mainPhotoIdLocal)
                          ? styles.badgeActive
                          : styles.badgeInactive
                      ]}
                      onPress={() => setMainPhotoIdLocal(String(item.id))}
                    >
                      <Text style={styles.badgeText}>대표 사진</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.closeWrapper}
                      onPress={() => handleHidePhoto(item.id)}
                    >
                      <Image
                        source={require("../assets/icons/xicon.png")}
                        style={styles.closeIconImg}
                      />
                    </TouchableOpacity>

                    <ConfirmModal
                      visible={isConfirmVisible}
                      title="사진 삭제"
                      message="정말 이 사진을 삭제하시겠어요?"
                      onCancel={onCancelDelete}
                      onConfirm={onConfirmDelete}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleDecorator>
        )}
        contentContainerStyle={{ paddingBottom: 180 }}
      />

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: "#D68089" }]}
          onPress={() => handleSaveAndNavigate("manual")}
        >
          <Text style={styles.saveButtonText}>직접 일기 작성</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: "#D68089" }]}
          onPress={() => handleSaveAndNavigate("ai")}
        >
          <Text style={styles.saveButtonText}>AI 일기 작성</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4", paddingBottom: 60 },
  header: {
    paddingHorizontal: 30,
    paddingTop: 75,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FCF9F4",
    paddingBottom: 10
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b"
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: "center",
    marginBottom: 30
  },
  cardShadowWrapper: {
    marginTop: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30
  },
  card: {
    width: screenWidth * 0.8,
    aspectRatio: 1,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative"
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1
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
    padding: 10
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff"
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 60,
    width: "100%",
    paddingHorizontal: 30
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center"
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold"
  }
});
