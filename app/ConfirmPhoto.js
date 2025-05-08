import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Button } from "react-native";
import { useRouter } from "expo-router";
import IconButton from "../components/IconButton";
import { useAuth } from "../contexts/AuthContext";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

export default function ConfirmPhoto() {
  const nav = useRouter();
  const [photoList, setPhotoList] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("임시 사진 목록:", data);
        const urls = data.map((photo) => photo.photoUrl);
        setPhotoList(urls);
      } catch (error) {
        console.error("임시 사진 불러오기 실패", error);
      }
    };

    fetchPhotos();
  }, [token]);

  const handleBack = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const ids = data.map((photo) => photo.id);

      await Promise.all(
        ids.map((id) =>
          fetch(`${BACKEND_URL}/api/photos/selection/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      console.log("모든 임시 사진 삭제 완료");
    } catch (error) {
      console.error("사진 삭제 중 오류:", error);
    }

    nav.push("/create");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          source={require("../assets/icons/backicon.png")}
          hsize={22}
          wsize={22}
          style={styles.back}
          onPress={handleBack}
        />
        <Text style={styles.date}>원하는 일기 방식을 선택해주세요</Text>
        <View style={{ width: 24 }} />
      </View>

      <View contentContainerStyle={styles.grid}>
        {photoList.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="직접 쓰기"
          onPress={() => {
            /* TODO */
          }}
        />
        <Button
          title="AI 생성 일기"
          onPress={() => {
            /* TODO */
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 75,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },
  back: {
    fontSize: 24,
    color: "#a78c7b",
  },
  title: { fontSize: 16, textAlign: "center", marginVertical: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a78c7b",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#FEE500",
    borderRadius: 8,
    padding: 10,
    width: "40%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    padding: 20,
  },
});
