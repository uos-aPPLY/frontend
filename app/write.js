import { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Text,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import HeaderDate from "../components/Header/HeaderDate";
import IconButton from "../components/IconButton";
import TextBox from "../components/TextBox";
import characterList from "../assets/characterList";
import { useDiary } from "../contexts/DiaryContext";
import { useAuth } from "../contexts/AuthContext";
import { formatGridData } from "../utils/formatGridData";
import Constants from "expo-constants";

const screenWidth = Dimensions.get("window").width;

export default function WritePage() {
  const flatListRef = useRef(null);

  const nav = useRouter();
  const {
    text,
    setText,
    selectedCharacter,
    setSelectedCharacter,
    selectedDate,
    setSelectedDate,
  } = useDiary();
  const { token } = useAuth();
  const { BACKEND_URL } = Constants.expoConfig.extra;
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);
  const date = selectedDate?.toISOString().split("T")[0];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTempPhotos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/photos/selection/temp`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setTempPhotos(data);
      } catch (error) {
        console.error("임시 사진 불러오기 실패:", error);
      }
    };
    if (token) fetchTempPhotos();
  }, [token]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.all}>
        <HeaderDate
          date={date}
          onBack={() => {
            setText("");
            setSelectedCharacter(require("../assets/character/char1.png"));
            setSelectedDate(null);
            nav.push("/calendar");
          }}
          hasText={text.trim().length > 0}
        />

        <View style={styles.middle}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.imageWrapper}>
              <View style={styles.pageIndicator}>
                {tempPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                      });
                      setCurrentIndex(index); // 인디케이터 UI 업데이트
                    }}
                    style={styles.indicatorItem}
                  >
                    {currentIndex === index ? (
                      <Image
                        source={{ uri: photo.photoUrl }}
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <View style={styles.dot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                ref={flatListRef}
                data={tempPhotos}
                keyExtractor={(item, index) =>
                  item.id?.toString() ?? index.toString()
                }
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / screenWidth
                  );
                  setCurrentIndex(index);
                }}
                renderItem={({ item }) => (
                  <View style={styles.shadowCard}>
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={styles.image}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.characterPicker}>
              <View style={{ width: 24, height: 24 }} />
              <IconButton
                source={selectedCharacter}
                wsize={40}
                hsize={40}
                onPress={() => setIsPickerVisible(!isPickerVisible)}
              />
              <IconButton
                source={require("../assets/icons/pictureinfoicon.png")}
                wsize={24}
                hsize={24}
                onPress={() => nav.push("/photoReorder")}
              />
            </View>

            <View style={styles.low}>
              {isPickerVisible ? (
                <View style={styles.overlay}>
                  {formatGridData(characterList, 3).map((char, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (char) {
                          setSelectedCharacter(char);
                          setIsPickerVisible(false);
                        }
                      }}
                      disabled={!char}
                    >
                      {char ? (
                        <Image source={char} style={styles.characterIcon} />
                      ) : (
                        <View style={[styles.characterIcon, { opacity: 0 }]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextBox
                  value={text}
                  onChangeText={setText}
                  placeholder="오늘의 이야기를 써보세요."
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
    flex: 1,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  indicatorItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
  },

  dotActive: {
    backgroundColor: "#A78C7B",
  },

  thumbnailImage: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },

  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F2F1",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: screenWidth - 60,
    aspectRatio: 1,
    borderRadius: 20,
    resizeMode: "cover",
    marginHorizontal: 30, // 중앙 정렬
  },

  middle: {
    flex: 1,
    backgroundColor: "#FCF9F4",
    paddingTop: 15,
  },
  characterPicker: {
    paddingBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 35,
  },
  low: {
    paddingHorizontal: 30,
    flex: 1,
    marginBottom: 30,
  },
  overlay: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  characterIcon: {
    width: 64,
    height: 62,
    margin: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
