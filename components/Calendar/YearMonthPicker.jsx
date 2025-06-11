import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from "react-native";
import { format } from "date-fns";

const screenHeight = Dimensions.get("window").height;

export default function YearMonthPicker({ visible, currentMonth, onSelect, onClose }) {
  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);

  // 2020년부터 현재 년도 + 5년까지
  const years = [];
  for (let year = 2020; year <= currentYear; year++) {
    years.push(year);
  }

  const months = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월"
  ];

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    onSelect(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonthNum);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>년/월 선택</Text>
          </View>

          <View style={styles.pickerContainer}>
            {/* 년도 선택 */}
            <View style={styles.pickerColumn}>
              <Text style={styles.columnTitle}>년도</Text>
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.pickerItem, selectedYear === year && styles.selectedItem]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.pickerText, selectedYear === year && styles.selectedText]}>
                      {year}년
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 월 선택 */}
            <View style={styles.pickerColumn}>
              <Text style={styles.columnTitle}>월</Text>
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.pickerItem, selectedMonth === index && styles.selectedItem]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text
                      style={[styles.pickerText, selectedMonth === index && styles.selectedText]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    backgroundColor: "#FFFEFE",
    borderRadius: 30,
    width: "85%",
    maxHeight: screenHeight * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A78C7B",
    textAlign: "center"
  },
  pickerContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 10
  },
  columnTitle: {
    paddingTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#A78C7B",
    textAlign: "center",
    marginBottom: 10
  },
  scrollView: {
    maxHeight: 200
  },
  scrollContent: {
    alignItems: "center"
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 15,
    minWidth: 80,
    alignItems: "center"
  },
  selectedItem: {
    backgroundColor: "#D68089"
  },
  pickerText: {
    fontSize: 16,
    color: "#A78C7B"
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "600"
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0"
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    marginRight: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D68089",
    alignItems: "center"
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#D68089",
    fontWeight: "600"
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    marginLeft: 10,
    borderRadius: 15,
    backgroundColor: "#D68089",
    alignItems: "center"
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600"
  }
});
