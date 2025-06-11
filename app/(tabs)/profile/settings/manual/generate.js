import React, { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const pages = [
  {
    image: require("../../../../../assets/tutorial/generatetutorial1.png")
  },
  {
    image: require("../../../../../assets/tutorial/generatetutorial2.png")
  },
  {
    image: require("../../../../../assets/tutorial/generatetutorial3.png")
  }
];

export default function GenerateManual() {
  const scrollRef = useRef(null);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const goBack = () => {
    router.back();
  };

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const onNext = () => {
    if (currentIndex < pages.length - 1) {
      scrollRef.current.scrollTo({
        x: width * (currentIndex + 1),
        animated: true
      });
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {pages.map((page, idx) => (
          <View key={idx} style={styles.page}>
            <Image source={page.image} style={styles.pageImage} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {pages.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentIndex ? styles.activeDot : styles.dotInactive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.completeButton} onPress={onNext}>
        <Text style={styles.completeButtonText}>
          {currentIndex < pages.length - 1 ? "다음" : "완료"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#888889"
  },
  scrollView: {
    flex: 1
  },
  contentContainer: {
    alignItems: "center"
  },
  page: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center"
  },
  pageImage: {
    width: width,
    height: height,
    resizeMode: "contain"
  },
  pagination: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(217, 217, 217, 0.8)",
    marginHorizontal: 4
  },
  activeDot: {
    backgroundColor: "rgba(243, 217, 220, 0.9)"
  },
  completeButton: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(243, 217, 220, 0.9)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  completeButtonText: {
    color: "#626262",
    fontSize: 16,
    fontWeight: "600"
  }
});
