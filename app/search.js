import { useState } from "react";
import { View, FlatList, StyleSheet, Text, Image, TouchableOpacity } from "react-native";
import HeaderSearch from "../components/Header/HeaderSearch";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format, parse } from "date-fns";

export default function Search() {
  const nav = useRouter();
  const { from } = useLocalSearchParams();
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleBack = () => {
    nav.back();
  };

  return (
    <View style={styles.container}>
      <HeaderSearch
        value={keyword}
        onChangeText={setKeyword}
        onBack={handleBack}
        onResult={(results) => setSearchResults(results.content || [])}
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => nav.push(`/diary/${item.diaryDate}`)}
            style={styles.card}
          >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.representativePhotoUrl }} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardContent} numberOfLines={3}>
                {item.content}
              </Text>
              <Text style={styles.cardDate}>
                {format(parse(item.diaryDate, "yyyy-MM-dd", new Date()), "yyyy년 M월 d일 (E)")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          keyword.length >= 2 && <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F4"
  },
  resultContainer: {
    padding: 20
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd"
  },
  resultText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5C4033"
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 4
  },
  noResult: {
    marginTop: 30,
    textAlign: "center",
    color: "#A78C7B"
  },
  listContent: {
    marginTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFEFE",
    marginBottom: 18,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    overflow: "visible"
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: "hidden"
  },
  cardImage: {
    width: 120,
    height: 120,
    resizeMode: "cover"
  },
  cardTextContainer: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between"
  },
  cardContent: {
    fontSize: 16,
    color: "#A78C7B",
    lineHeight: 22
  },
  cardDate: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "right"
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999"
  }
});
