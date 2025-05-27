// app/(onboarding)/speechstyle.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import TextEditorModal from "../../components/Modal/TextEditorModal";

const { BACKEND_URL } = Constants.expoConfig.extra;

const templates = {
  기록형:
    "오늘은 아침 8시에 일어났다. 날씨가 흐려서 그런지 몸이 조금 무거웠다. 오전엔 도서관에서 공부했고, 오후엔 친구와 카페에서 얘기를 나눴다. 하루가 평범하게 흘러갔다.",
  감성형:
    "이상하게 오늘은 마음이 조금 복잡했다. 별일 없었는데도 계속 생각이 많아졌다. 커피를 마시면서 친구랑 수다를 떨었는데, 그 순간만큼은 마음이 편해지는 걸 느꼈다. 이런 하루도 나쁘지 않았다.",
  경쾌형:
    "으아 오늘 진짜 정신없었음! ㅋㅋ 아침부터 지각할 뻔하고, 수업도 집중 안 되고, 배는 계속 꼬르륵… 그래도 저녁에 먹은 떡볶이로 하루 마무리 성공! 역시 매운 맛이 최고야 🔥",
  "내면 대화형":
    "오늘 나는 왜 이렇게 예민했을까? 작은 일에도 짜증이 났다. 나도 내 감정을 이해하기 어려웠다. 아마도 내가 스스로를 너무 몰아붙이고 있었던 걸지도. 내일은 조금 더 나를 다정하게 대해야겠다.",
  관찰형:
    "오늘은 하늘의 색이 특별했다. 회색 구름 사이로 파란 하늘이 조금씩 보였고, 길가의 은행나무 잎들은 바람에 흔들렸다. 지하철에서 만난 할머니는 따뜻한 미소를 지어주셨고, 회사 앞 카페에서는 새로운 원두 향이 났다. 사소한 순간들이 모여 하루를 완성했다.",
  계획형:
    "오늘 할 일 중 세 가지를 완료했다. 프로젝트 기획안 제출, 저녁 식사 준비, 30분 운동. 내일은 반드시 책 50페이지를 읽고, 영어 단어 20개를 외우고, 빨래를 완료해야 한다. 주말까지 보고서를 마무리하려면 매일 조금씩 진행해야 할 것이다. 계획대로 차근차근 해나가자.",
};

export default function SpeechStyle() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const stylesArray = Object.keys(templates);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState(text);

  useEffect(() => {
    if (from === "settings") {
      (async () => {
        setLoading(true);
        try {
          const token = await SecureStore.getItemAsync("accessToken");
          if (!token) throw new Error("인증 토큰이 없습니다.");

          const res = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("사용자 정보 조회 실패");

          const user = await res.json();
          const { writingStylePrompt, writingStyleNumber } = user;
          const styleKey = stylesArray[writingStyleNumber];
          if (styleKey) {
            setSelected(styleKey);
            setText(writingStylePrompt);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [from]);

  useEffect(() => {
    setModalText(text);
  }, [text]);

  const onSelect = (style) => {
    setSelected(style);
    setText(templates[style]);
  };

  const goBack = () => {
    if (from === "settings") {
      router.back();
    } else {
      router.replace("/nickname");
    }
  };

  const onConfirm = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) throw new Error("인증 토큰이 없습니다.");

      const writingStyleNumber = stylesArray.indexOf(selected);
      const response = await fetch(`${BACKEND_URL}/api/users/writing-style`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: text.trim(), writingStyleNumber }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`말투 저장 실패: ${errorText}`);
      }

      if (from === "settings") {
        router.replace("/settings");
      } else {
        router.replace("/tutorial");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("오류", err.message || "말투 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = selected !== null && !loading;

  if (loading && from === "settings" && !selected) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Image
          source={require("../../assets/icons/backicon.png")}
          style={styles.backicon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>
          DiaryPic에서 사용할{"\n"}말투를 선택 및 수정해 주세요.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {stylesArray.map((styleName, idx) => (
            <TouchableOpacity
              key={styleName}
              style={[
                styles.styleButton,
                idx % 2 === 0 ? { marginRight: 8 } : null,
                selected === styleName && styles.styleButtonSelected,
              ]}
              onPress={() => onSelect(styleName)}
            >
              <Text
                style={
                  selected === styleName
                    ? styles.styleTextSelected
                    : styles.styleText
                }
              >
                {styleName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isValid && (
        <View style={styles.editorContainer}>
          <Text style={styles.descriptionText}>
            아래의 말투를 누르면 커스터마이징이 가능해요.
          </Text>

          <TouchableOpacity
            style={styles.textInput}
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <Text>{text}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.confirmButton,
          isValid ? styles.confirmEnabled : styles.confirmDisabled,
        ]}
        onPress={onConfirm}
        disabled={!isValid}
      >
        <Text style={styles.confirmText}>
          {loading ? "저장 중..." : "확인"}
        </Text>
      </TouchableOpacity>

      <TextEditorModal
        visible={modalVisible}
        initialText={text}
        onSave={(edited) => setText(edited)}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f4",
    paddingTop: 70,
    paddingHorizontal: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcf9f4",
  },
  header: { marginBottom: 20 },
  backButton: { position: "absolute", top: 80, left: 30, padding: 8 },
  backicon: { width: 12, height: 22 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 36,
    textAlign: "left",
  },
  scrollContent: { paddingTop: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  styleButton: {
    width: "48%",
    height: 100,
    backgroundColor: "#F3D9DC",
    marginBottom: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  styleButtonSelected: {
    borderWidth: 7,
    borderColor: "rgba(214, 128, 137, 0.7)",
  },
  styleText: { fontSize: 16, color: "black" },
  styleTextSelected: {
    fontSize: 16,
    color: "rgba(214, 128, 137, 0.7)",
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 12,
    color: "#000000",
    marginLeft: 5,
    marginBottom: 5,
  },
  editorContainer: {},
  textInput: {
    height: 120,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#fff",
    fontSize: 14,
    marginBottom: 10,
  },
  confirmButton: {
    marginBottom: 60,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
  },
  confirmEnabled: { backgroundColor: "rgba(214, 128, 137, 0.7)" },
  confirmDisabled: { backgroundColor: "#D9D9D9" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10,
  },
  modalTextInput: {
    minHeight: 100,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
});
