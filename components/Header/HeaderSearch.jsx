import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import IconButton from "../IconButton";
import Constants from "expo-constants";

const { BACKEND_URL } = Constants.expoConfig.extra;

const HeaderSearch = ({ onBack, onResult }) => {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (keyword.length < 2) {
        onResult([]); // 두 글자 이하일 때 결과 비우기
        return;
      }

      try {
        setIsSearching(true);
        const res = await fetch(
          `${BACKEND_URL}/api/diaries/search?keyword=${encodeURIComponent(
            keyword
          )}`
        );
        const data = await res.json();
        onResult(data); // 결과를 부모에게 전달
      } catch (error) {
        console.error("검색 오류", error);
        onResult([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  return (
    <View style={styles.all}>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Image
            source={require("../../assets/icons/brownsearchicon.png")}
            style={styles.searchIcon}
          />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            style={styles.input}
            cursorColor="#AC8B78"
            placeholder="검색어 입력 (2글자 이상)"
            placeholderTextColor="#AC8B78"
          />
          {isSearching && <ActivityIndicator size="small" color="#D68089" />}
        </View>
        <View style={{ marginLeft: 15 }}>
          <IconButton
            source={require("../../assets/icons/xicon.png")}
            hsize={18}
            wsize={18}
            onPress={onBack}
          />
        </View>
      </View>
    </View>
  );
};

export default HeaderSearch;

const styles = StyleSheet.create({
  all: {
    backgroundColor: "#FCF9F4",
  },
  container: {
    height: 130,
    width: "100%",
    backgroundColor: "#E3A7AD",
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  searchIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    fontSize: 16,
    outlineStyle: "none",
  },
});
