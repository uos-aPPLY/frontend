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

const { BACKEND_URL } = Constants.expoConfig.extra;
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 20 * 2 - 12) / 2;

export default function ProfilePage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const favRes = await fetch(`${BACKEND_URL}/api/albums/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const favJson = await favRes.json();
        const favCover = favJson[0]?.representativePhotoUrl;
        const favAlbum = {
          id: "favorite",
          name: "좋아요",
          coverUrl: favCover,
        };

        const allRes = await fetch(`${BACKEND_URL}/api/albums`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allJson = await allRes.json();
        const otherAlbums = allJson.map((a) => ({
          id: a.id,
          name: a.name,
          coverUrl: a.coverImageUrl,
        }));

        setAlbums([favAlbum, ...otherAlbums]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/icons/settingicon.png")}
          style={styles.settingsIcon}
        />
        <View style={styles.profileRow}>
          <Image
            source={require("../../assets/bangulicon.png")}
            style={styles.bangulicon}
          />
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>수빈</Text>
              <Image
                source={require("../../assets/icons/editicon.png")}
                style={styles.editIcon}
              />
            </View>
            <Text style={styles.stats}>총 일기 수 10</Text>
            <Text style={styles.stats}>올해 일기 수 10</Text>
            <Text style={styles.stats}>이번 달 일기 수 10</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  settingsIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    resizeMode: "contain",
    width: 24,
    height: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  bangulicon: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  nameSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "bold",
  },
  editIcon: {
    marginLeft: 8,
    resizeMode: "contain",
    width: 20,
    height: 20,
  },
  stats: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "center",
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 20,
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    color: "#8B6F5B",
  },
});
