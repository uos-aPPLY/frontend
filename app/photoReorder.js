// app/PhotoReorder.js
import { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";

const screenWidth = Dimensions.get("window").width;

export default function PhotoReorder() {
  const router = useRouter();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const flatListRef = useRef(null);
  const { photoList, setPhotoList, setMainPhotoId } = usePhoto();

  const [photos, setPhotos] = useState([]);
  const [mainPhotoIdLocal, setMainPhotoIdLocal] = useState(null);
  const [hiddenIds, setHiddenIds] = useState([]);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => !hiddenIds.includes(photo.id)),
    [photos, hiddenIds]
  );

  useEffect(() => {
    if (photoList.length > 0) {
      setPhotos(photoList);
      setMainPhotoIdLocal(photoList[0]?.id || null);
    }
  }, [photoList]);

  const handleSaveOrder = () => {
    setPhotoList(visiblePhotos); // ✅ 전역에 순서 저장
    setMainPhotoId(mainPhotoIdLocal); // ✅ 전역에 대표사진 저장
    router.back();
  };

  const handleHidePhoto = (id) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          wsize={22}
          hsize={22}
          onPress={() => router.back()}
        />
        <Text style={styles.title}>사진 순서 수정</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* 사진 리스트 */}
      <DraggableFlatList
        ref={flatListRef}
        data={visiblePhotos}
        keyExtractor={(item) => item.id.toString()}
        onDragEnd={({ data }) => setPhotos(data)}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <View style={styles.cardWrapper}>
              <View style={styles.cardShadowWrapper}>
                <TouchableOpacity onPressIn={drag} activeOpacity={1}>
                  <View style={[styles.card, isActive && { opacity: 0.8 }]}>
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={styles.cardImage}
                    />

                    {/* 대표 사진 표시 */}
                    <TouchableOpacity
                      style={[
                        styles.badgeOverlay,
                        item.id === mainPhotoIdLocal
                          ? styles.badgeActive
                          : styles.badgeInactive,
                      ]}
                      onPress={() => setMainPhotoIdLocal(item.id)}
                    >
                      <Text style={styles.badgeText}>대표 사진</Text>
                    </TouchableOpacity>

                    {/* 숨기기 버튼 */}
                    <TouchableOpacity
                      style={styles.closeWrapper}
                      onPress={() => handleHidePhoto(item.id)}
                    >
                      <Image
                        source={require("../assets/icons/xicon.png")}
                        style={styles.closeIconImg}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleDecorator>
        )}
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      {/* 저장 버튼 */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
          <Text style={styles.saveButtonText}>순서 저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCF9F4" },
  header: {
    paddingHorizontal: 30,
    paddingTop: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FCF9F4",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b",
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: "center",
    marginBottom: 30,
  },
  cardShadowWrapper: {
    marginTop: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
  },
  card: {
    width: screenWidth * 0.8,
    aspectRatio: 1,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badgeOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: "#D68089",
    borderColor: "#fff",
  },
  badgeInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  closeWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 10,
  },
  closeIconImg: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
  bottomRow: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 30,
  },
  saveButton: {
    backgroundColor: "#D9A2A8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
