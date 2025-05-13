// app/PhotoReorder.js
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import Constants from "expo-constants";
import DraggableFlatList from "react-native-draggable-flatlist";
import { usePhoto } from "../contexts/PhotoContext";
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";

const screenWidth = Dimensions.get("window").width;

export default function PhotoReorder() {
  const router = useRouter();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const [photos, setPhotos] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("✅ API 결과:", data[0]);
        setPhotos(data);
      } catch (err) {
        console.error("사진 불러오기 실패:", err);
      }
    };

    if (token) fetchPhotos();
  }, [token]);

  const handleSaveOrder = () => {
    // TODO: 서버에 순서 저장 API 연동 예정
    console.log(
      "📦 최종 순서:",
      photos.map((p) => p.id)
    );
    router.back();
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
        <View style={{ width: 22 }} /> {/* 오른쪽 여백 */}
      </View>

      <DraggableFlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id.toString()}
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
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleDecorator>
        )}
        onDragEnd={({ data }) => setPhotos(data)}
        contentContainerStyle={styles.listContent}
      />

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
        <Text style={styles.saveButtonText}>순서 저장</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 75,
    paddingBottom: 50,
  },
  header: {
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b",
  },
  listContent: {
    paddingHorizontal: 30,
    paddingBottom: 100,
    gap: 20,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardWrapper: {
    width: "100%",
  },
  cardShadowWrapper: {
    marginBottom: 10,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  saveButton: {
    position: "absolute",
    bottom: 40,
    left: 30,
    right: 30,
    backgroundColor: "#D9A2A8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
