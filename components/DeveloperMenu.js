import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useServerStatus } from "../contexts/ServerStatusContext";
import { TEST_MAINTENANCE_MODE } from "../constants/serverConfig";

const DeveloperMenu = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("테스트용 점검 메시지입니다.");
  const {
    serverStatus,
    forceMaintenanceMode,
    clearMaintenanceMode,
    forceServerDownMode,
    checkServerHealth,
    retryConnection,
    retryCount
  } = useServerStatus();

  // 개발 환경에서만 보이도록 (이중 안전장치)
  if (!__DEV__ || !TEST_MAINTENANCE_MODE || process.env.NODE_ENV === "production") {
    return null;
  }

  const handleForceMaintenanceMode = () => {
    console.log("Handle force maintenance mode clicked");
    forceMaintenanceMode(maintenanceMessage);
    setIsVisible(false); // 모달 닫기
    Alert.alert("점검 모드 활성화", "점검 모드가 활성화되었습니다.");
  };

  const handleClearMaintenanceMode = () => {
    console.log("Handle clear maintenance mode clicked");
    clearMaintenanceMode();
    setIsVisible(false); // 모달 닫기
    Alert.alert("점검 모드 해제", "점검 모드가 해제되었습니다.");
  };

  const handleTestServerDown = () => {
    console.log("Handle test server down clicked");
    forceServerDownMode();
    setIsVisible(false); // 모달 닫기
    Alert.alert("서버 다운 모드 활성화", "서버 다운 상태가 시뮬레이션되었습니다.");
  };

  const handleResetToNormal = () => {
    console.log("Handle reset to normal clicked");
    clearMaintenanceMode(); // 이 함수가 모든 테스트 모드를 리셋함
    retryConnection(); // 정상 서버 상태로 복원
    setIsVisible(false); // 모달 닫기
    Alert.alert("정상 모드 복원", "모든 테스트 모드가 해제되고 정상 상태로 복원되었습니다.");
  };

  return (
    <>
      {/* 개발자 메뉴 버튼 - 화면 우측 상단에 고정 */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setIsVisible(true)}>
        <Ionicons name="bug" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 개발자 메뉴 모달 */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.title}>개발자 메뉴</Text>
                <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* 현재 서버 상태 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>현재 서버 상태</Text>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>온라인 상태:</Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor:
                          serverStatus.isOnline === null
                            ? "#FFA500"
                            : serverStatus.isOnline
                            ? "#4CAF50"
                            : "#F44336"
                      }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {serverStatus.isOnline === null
                        ? "확인 중"
                        : serverStatus.isOnline
                        ? "온라인"
                        : "오프라인"}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>점검 모드:</Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: serverStatus.isUnderMaintenance ? "#FF9800" : "#4CAF50" }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {serverStatus.isUnderMaintenance ? "점검 중" : "정상"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.infoText}>재시도 횟수: {retryCount}</Text>
                <Text style={styles.infoText}>
                  마지막 확인:{" "}
                  {serverStatus.lastChecked
                    ? new Date(serverStatus.lastChecked).toLocaleTimeString()
                    : "없음"}
                </Text>
              </View>

              {/* 점검 모드 테스트 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>점검 모드 테스트</Text>

                <Text style={styles.label}>점검 메시지:</Text>
                <TextInput
                  style={styles.textInput}
                  value={maintenanceMessage}
                  onChangeText={setMaintenanceMessage}
                  placeholder="점검 메시지를 입력하세요"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.testButton, styles.maintenanceButton]}
                    onPress={handleForceMaintenanceMode}
                  >
                    <Ionicons name="construct" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>점검 모드 활성화</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.testButton, styles.normalButton]}
                    onPress={handleClearMaintenanceMode}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>점검 모드 해제</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 서버 상태 테스트 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>서버 연결 테스트</Text>

                <TouchableOpacity
                  style={[styles.testButton, styles.testServerButton]}
                  onPress={handleTestServerDown}
                >
                  <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>서버 다운 시뮬레이션</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.testButton, styles.refreshButton]}
                  onPress={() => checkServerHealth()}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>서버 상태 재확인</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.testButton, styles.resetButton]}
                  onPress={handleResetToNormal}
                >
                  <Ionicons name="reload" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>정상 모드 복원</Text>
                </TouchableOpacity>
              </View>

              {/* 경고 메시지 */}
              <View style={styles.warningSection}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  이 메뉴는 개발 환경에서만 표시됩니다.{"\n"}
                  실제 서버 상태를 변경하지는 않습니다.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },
  closeButton: {
    padding: 5
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    width: 80
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
    textAlignVertical: "top"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    flex: 1,
    marginHorizontal: 5
  },
  maintenanceButton: {
    backgroundColor: "#FF9800"
  },
  normalButton: {
    backgroundColor: "#4CAF50"
  },
  testServerButton: {
    backgroundColor: "#F44336"
  },
  refreshButton: {
    backgroundColor: "#2196F3"
  },
  resetButton: {
    backgroundColor: "#9C27B0"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5
  },
  warningSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 8,
    marginTop: 10
  },
  warningText: {
    fontSize: 12,
    color: "#F57C00",
    marginLeft: 10,
    flex: 1
  }
});

export default DeveloperMenu;
