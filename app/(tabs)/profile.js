// app/(tabs)/profile.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import TextEditorModal from "../../components/Modal/TextEditorModal";
import ConfirmModal from "../../components/Modal/ConfirmModal";

const { BACKEND_URL } = Constants.expoConfig.extra;
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 30 * 2 - 18) / 2; // padding 20 each side + 12 gap

export default function ProfilePage() {
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [diaryCounts, setDiaryCounts] = useState({
    total: 0,
    year: 0,
    month: 0,
  });
  const [isModalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setNickname(json.nickname || "");
        setDiaryCounts({
          total: json.totalDiariesCount || 0,
          year: json.yearDiariesCount || 0,
          month: json.monthDiariesCount || 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const favRes = await fetch(`${BACKEND_URL}/api/albums/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const favJson = await favRes.json();

        const allRes = await fetch(`${BACKEND_URL}/api/albums`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allJson = await allRes.json();
        const otherAlbums = allJson.map((a) => ({
          id: a.id,
          name: a.name,
          coverUrl: a.coverImageUrl,
        }));
        let albumsList = otherAlbums;
        if (Array.isArray(favJson) && favJson.length > 0) {
          const favCover = favJson[0].representativePhotoUrl;
          albumsList = [
            { id: "favorite", name: "좋아요", coverUrl: favCover },
            ...otherAlbums,
          ];
        }
        setAlbums(albumsList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, []);

  const handleSaveNickname = async (newName) => {
    const cleaned = newName
      .replace(/[\r\n]/g, "")
      .trim()
      .slice(0, 10);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      await fetch(`${BACKEND_URL}/api/users/nickname`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: cleaned }),
      });
      setNickname(cleaned);
    } catch (e) {
      console.error(e);
    }
    setModalVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsWrapper}
        >
          <Image
            source={require("../../assets/icons/settingicon.png")}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <Image
            source={require("../../assets/bangulicon.png")}
            style={styles.bangulicon}
          />
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{nickname}</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={require("../../assets/icons/editicon.png")}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.stats}>총 일기 수 {diaryCounts.total}</Text>
            <Text style={styles.stats}>올해 일기 수 {diaryCounts.year}</Text>
            <Text style={styles.stats}>
              이번 달 일기 수 {diaryCounts.month}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: `/albums/${item.id}`,
                params: { name: item.name },
              })
            }
            onLongPress={() => {
              setAlbumToDelete(item);
              setConfirmModalVisible(true);
            }}
          >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />
            </View>
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TextEditorModal
        visible={isModalVisible}
        initialText={nickname}
        onSave={handleSaveNickname}
        onCancel={() => setModalVisible(false)}
        hintText="최대 10자까지 작성 가능해요."
      />
      <ConfirmModal
        visible={confirmModalVisible}
        title="앨범 삭제"
        message={`${albumToDelete?.name} 앨범을 삭제하시겠습니까?`}
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => {
          setConfirmModalVisible(false);
          setAlbumToDelete(null);
        }}
        onConfirm={async () => {
          try {
            const token = await SecureStore.getItemAsync("accessToken");
            await fetch(`${BACKEND_URL}/api/albums/${albumToDelete.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            setAlbums((prev) => prev.filter((a) => a.id !== albumToDelete.id));
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmModalVisible(false);
            setAlbumToDelete(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF9F4",
  },
  header: {
    backgroundColor: "rgba(214, 128, 137, 0.7)",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 26,
  },
  settingsWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  settingsIcon: {
    position: "absolute",
    top: 60,
    right: 30,
    resizeMode: "contain",
    width: 24,
    height: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bangulicon: {
    width: 64,
    height: 64,
    marginRight: 26,
    resizeMode: "contain",
  },
  nameSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  editIcon: {
    marginLeft: 8,
    resizeMode: "contain",
    width: 18,
    height: 18,
  },
  stats: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "center",
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 30,
    overflow: "hidden",
  },
  imageWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    overflow: "visible",
  },
  cardText: {
    marginTop: 6,
    fontSize: 14,
    color: "#AC8B78",
  },
});
