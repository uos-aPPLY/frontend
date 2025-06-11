import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import ConfirmModal from "../components/Modal/ConfirmModal";

const screenWidth = Dimensions.get("window").width;

export default function PhotoReorder() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const {
    tempPhotoList,
    setTempPhotoList,
    photoList,
    setPhotoList,
    setSelected,
    mainPhotoId,
    setMainPhotoId
  } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [mainPhotoIdLocal, setMainPhotoIdLocal] = useState(null);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [targetPhotoId, setTargetPhotoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const effectivePhotos = useMemo(() => tempPhotoList ?? photoList, [tempPhotoList, photoList]);

  const visiblePhotos = useMemo(
    () => photos.filter((p) => !hiddenIds.includes(p.id)),
    [photos, hiddenIds]
  );

  // ✅ 페이지 포커스될 때마다 최신 데이터로 업데이트
  useFocusEffect(
    useCallback(() => {
      console.log("📋 PhotoReorder 포커스 - 데이터 업데이트");
      console.log("현재 effectivePhotos:", effectivePhotos);

      setIsLoading(true); // 로딩 시작

      // ✅ 약간의 지연 후 데이터 업데이트 (이전 렌더링 방지)
      setTimeout(() => {
        setPhotos(effectivePhotos);
        setHiddenIds([]); // 숨김 목록도 초기화

        const valid =
          effectivePhotos.find((p) => String(p.id) === String(mainPhotoId)) || effectivePhotos[0];
        setMainPhotoIdLocal(valid?.id ?? null);

        setIsLoading(false); // 로딩 완료
      }, 50);
    }, [effectivePhotos, mainPhotoId])
  );

  // 대표사진이 숨겨졌을 때 자동으로 대체
  useEffect(() => {
    const visible = photos.filter((p) => !hiddenIds.includes(p.id));

    // ✅ 대표사진이 없거나 현재 보이는 사진에 없으면 첫 번째로 설정
    if (!mainPhotoIdLocal || !visible.some((p) => String(p.id) === String(mainPhotoIdLocal))) {
      if (visible.length > 0) {
        console.log("🔄 대표사진 재설정:", visible[0].id);
        setMainPhotoIdLocal(visible[0].id);
      } else {
        console.log("⚠️ 보이는 사진이 없음");
        setMainPhotoIdLocal(null);
      }
    }
  }, [hiddenIds, photos, mainPhotoIdLocal]);

  const handleSaveOrder = () => {
    const newOrder = photos.filter((p) => !hiddenIds.includes(p.id));
    const newIds = newOrder.map((p) => String(p.id));

    setSelected(newIds);
    setPhotoList(newOrder);
    setTempPhotoList(null);
    setMainPhotoId(mainPhotoIdLocal);
    router.back();
  };

  const handleBack = () => {
    setTempPhotoList(null);
    router.back();
  };

  const handleHidePhoto = (id) => {
    console.log("🗑️ 삭제 시도:", id);

    setTargetPhotoId(id);
    setIsConfirmVisible(true);
  };

  const onConfirmDelete = () => {
    if (targetPhotoId) {
      console.log("🗑️ 사진 삭제 확정:", targetPhotoId);
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
        <Text style={styles.title}>사진 순서 수정</Text>
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
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
          <Text style={styles.saveButtonText}>순서 저장</Text>
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
    marginBottom: 20
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
    width: screenWidth * 0.6,
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
    position: "absolute",
    bottom: 60,
    width: "100%",
    paddingHorizontal: 30
  },
  saveButton: {
    backgroundColor: "#D9A2A8",
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
