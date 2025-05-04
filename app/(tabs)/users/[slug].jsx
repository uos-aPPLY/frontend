import { Link, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const index = () => {
  const { slug } = useLocalSearchParams();
  return (
    <View>
      <Text>{slug} 슬러그는 이렇습니다.</Text>
      <Link href={"/"}>홈으로돌아가기</Link>
    </View>
  );
};

export default index;
