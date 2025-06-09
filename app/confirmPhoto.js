import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  FlatList,
  Dimensions
} from "react-native";
import { useRouter, useNavigation } from "expo-router"; // ✅ useNavigation 추가
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";
import { usePhoto } from "../contexts/PhotoContext";
import { formatGridData } from "../utils/formatGridData";
import Constants from "expo-constants";
import { useDiary } from "../contexts/DiaryContext";
import { useMemo } from "react";

const { BACKEND_URL } = Constants.expoConfig.extra;
const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function confirmPhoto() {
  const nav = useRouter();
  const navigation = useNavigation(); // ✅ 제스처 감지를 위한 navigation 객체
  const {
    photoList,
    setPhotoList,
    originalPhotoList,
    setOriginalPhotoList,
    selected,
    setSelected,
    setMode,
    resetPhoto,
    setMainPhotoId
  } = usePhoto();
  const { token } = useAuth();
  const { selectedDate } = useDiary();
  const formattedGridData = useMemo(
    () => formatGridData(originalPhotoList, 3),
    [originalPhotoList]
  );
  const isSelectable = originalPhotoList.length > 9;

  const toggleSelect = (photo) => {
    const exists = selected.find((p) => p.id === photo.id);
    if (exists) {
      setSelected((prev) => prev.filter((p) => p.id !== photo.id));
    } else {
      if (selected.length >= 9) return;
      setSelected((prev) => [...prev, photo]);
    }
  };

  useEffect(() => {
    console.log("✅ selected 변경됨:", selected);
  }, [selected]);

  useEffect(() => {
    console.log("📅 confirmPhoto에서 selectedDate:", selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        console.log("🥵임시 사진 목록:", data);
        setPhotoList(data);
        setOriginalPhotoList(data);
      } catch (error) {
        console.error("임시 사진 불러오기 실패", error);
      }
    };

    fetchPhotos();
  }, [token]);

  // ✅ 뒤로가기 정리 함수
  const cleanupPhotos = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      const ids = data.map((photo) => photo.id);

      await Promise.all(
        ids.map((id) =>
          fetch(`${BACKEND_URL}/api/photos/selection/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        )
      );

      console.log("🧹 모든 임시 사진 삭제 완료");
      resetPhoto();
    } catch (error) {
      console.error("❌ 사진 삭제 중 오류:", error);
    }
  };

  // ✅ 물리/제스처 뒤로가기를 막고 정리 수행
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", async () => {
      await cleanupPhotos();
    });

    return unsubscribe;
  }, [navigation, token]);

  const handleBack = async () => {
    await cleanupPhotos();
    nav.replace("/create");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, photoList.length <= 9 && { marginBottom: 30 }]}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          style={styles.back}
          onPress={handleBack}
        />
        <Text style={styles.letter}>
          {originalPhotoList.length <= 9
            ? "원하는 일기 방식을 선택해주세요."
            : "일기에 꼭 넣고 싶은 사진을 고르세요"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      {photoList.length > 9 && <Text style={styles.count}>{`${selected.length}/9`}</Text>}

      <FlatList
        data={formattedGridData}
        numColumns={3}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => {
          if (!item) return <View style={{ width: IMAGE_SIZE + 2, height: IMAGE_SIZE }} />;

          const isSelected = selected.some((p) => p.id === item.id);

          return (
            <Pressable onPress={() => isSelectable && toggleSelect(item)}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.photoUrl }} style={styles.image} />
                {isSelectable && isSelected && (
                  <>
                    <View style={styles.overlay} />
                    <Image
                      source={require("../assets/icons/pinkcheckicon.png")}
                      style={styles.checkIcon}
                    />
                  </>
                )}
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.grid}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setOriginalPhotoList(photoList);
            setPhotoList(originalPhotoList);
            setSelected(selected);
            setMainPhotoId(photoList.length > 0 ? String(photoList[0].id) : null);
            setMode("write");

            if (photoList.length > 9) {
              nav.push("/loading"); // ✅ 많은 사진이면 loading 먼저
            } else {
              nav.push("/write"); // ✅ 9장 이하면 바로 작성
            }
          }}
        >
          <Text style={styles.buttonText}>직접 쓰기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setOriginalPhotoList(photoList);
            setPhotoList(originalPhotoList);
            setSelected(selected);
            setMode("generate");
            nav.push("/loading");
          }}
        >
          <Text style={styles.buttonText}>AI 생성 일기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  header: {
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 75,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FCF9F4",
    alignItems: "center"
  },
  count: {
    fontSize: 14,
    color: "#a78c7b",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 5
  },
  back: {
    fontSize: 24,
    color: "#a78c7b"
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center"
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 1
  },
  letter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b",
    textAlign: "center"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 60,
    gap: 20,
    paddingHorizontal: 30
  },
  button: {
    backgroundColor: "#D9A2A8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flex: 1
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  overlay: {
    position: "absolute",
    top: 1,
    left: 1,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 4,
    borderColor: "#D68089"
  },
  imageWrapper: {
    position: "relative"
  },
  checkIcon: {
    position: "absolute",
    top: 12,
    left: IMAGE_SIZE - 12 - 24,
    width: 24,
    height: 24
  }
});
