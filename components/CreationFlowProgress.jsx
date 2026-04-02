import React from "react";
import { View, Text, StyleSheet } from "react-native";

const DEFAULT_STEPS = ["사진 업로드", "방식 선택", "베스트샷", "키워드", "일기 생성"];

export default function CreationFlowProgress({
  currentStep = 1,
  steps = DEFAULT_STEPS,
  subtitle
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={label}>
              <View style={styles.stepBlock}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.completedCircle,
                    isActive && styles.activeCircle
                  ]}
                >
                  <Text
                    style={[
                      styles.circleText,
                      (isCompleted || isActive) && styles.activeCircleText
                    ]}
                  >
                    {stepNumber}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isActive) && styles.highlightStepLabel
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    stepNumber < currentStep && styles.completedConnector
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 16
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  stepBlock: {
    width: 52,
    alignItems: "center"
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCCFC3",
    backgroundColor: "#FFF8F4",
    alignItems: "center",
    justifyContent: "center"
  },
  activeCircle: {
    borderColor: "#D68089",
    backgroundColor: "#D68089"
  },
  completedCircle: {
    borderColor: "#D68089",
    backgroundColor: "#F2D2D6"
  },
  circleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BCA89A"
  },
  activeCircleText: {
    color: "#FFFFFF"
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14,
    color: "#B3A79D",
    textAlign: "center"
  },
  highlightStepLabel: {
    color: "#8D6F60",
    fontWeight: "600"
  },
  connector: {
    flex: 1,
    height: 1,
    marginTop: 14,
    backgroundColor: "#E5DBD2"
  },
  completedConnector: {
    backgroundColor: "#D68089"
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: "#A78C7B",
    textAlign: "center"
  }
});
