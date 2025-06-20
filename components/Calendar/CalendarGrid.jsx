// components/Calendar/CalendarGrid.jsx
import React, { useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Easing
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format
} from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts as useCaveatFonts, Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { useFonts as useInterFonts, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";
import { useDiary } from "../../contexts/DiaryContext";
import { CalendarViewContext } from "../../contexts/CalendarViewContext";
import characterList from "../../assets/characterList";

const screenWidth = Dimensions.get("window").width;
const DAY_ITEM_SIZE = (screenWidth - 60) / 7;
const screenHeight = Dimensions.get("window").height;
const TIMEZONE = "Asia/Seoul";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const toSeoulDate = (date) =>
  new Date(
    date.toLocaleString("sv", {
      timeZone: TIMEZONE
    })
  );

const GeneratingProgressCircle = ({ size, duration, text, startTime }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const STROKE_WIDTH = 3;
  const radius = size / 2 - STROKE_WIDTH / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (typeof startTime !== "number" || startTime <= 0 || duration <= 0) {
      progress.setValue(0);
      return;
    }

    const now = Date.now();
    const elapsedTime = now - startTime;
    let initialProgressValue = 0;

    if (elapsedTime > 0) {
      initialProgressValue = Math.min(elapsedTime / duration, 1);
    }

    progress.setValue(initialProgressValue);

    if (initialProgressValue < 1) {
      const remainingDuration = duration * (1 - initialProgressValue);
      const newAnimation = Animated.timing(progress, {
        toValue: 1,
        duration: remainingDuration > 0 ? remainingDuration : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      });
      animationRef.current = newAnimation;
      newAnimation.start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [duration, startTime, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * 0.03]
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#D68089"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={[styles.generatingDayText, { position: "absolute" }]}>{text}</Text>
    </View>
  );
};

const useSingleNavigate = () => {
  const router = useRouter();
  const lockRef = useRef(false);

  return (path) => {
    if (lockRef.current) return;
    lockRef.current = true;
    router.push(path);

    setTimeout(() => {
      lockRef.current = false;
    }, 400);
  };
};

export default function CalendarGrid({ currentMonth, diariesByDate, onPrev, onNext }) {
  const singleNavigate = useSingleNavigate();
  const { selectedDate, setSelectedDate } = useDiary();
  const { showEmotion } = useContext(CalendarViewContext);

  const slideX = useRef(new Animated.Value(0)).current;

  const width = Dimensions.get("window").width;

  const slideToMonth = (direction) => {
    Animated.timing(slideX, {
      toValue: direction * width,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start(() => {
      if (direction === 1) onPrev?.();
      else onNext?.();

      slideX.setValue(-direction * width);

      Animated.timing(slideX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }).start();
    });
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) =>
          Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
        onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
          Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
        onPanResponderRelease: (_, { dx }) => {
          if (dx > 50) slideToMonth(1);
          else if (dx < -50) slideToMonth(-1);
        }
      }),
    [onPrev, onNext, slideX]
  );

  const [fontsCaveatLoaded] = useCaveatFonts({
    Caveat_600SemiBold
  });
  const [fontsInterLoaded] = useInterFonts({
    Inter_600SemiBold
  });
  if (!fontsCaveatLoaded || !fontsInterLoaded) {
    return <View />;
  }

  const todaySeoul = toSeoulDate(new Date());
  const todayStr = format(todaySeoul, "yyyy-MM-dd");
  const todayHasDiary = Boolean(diariesByDate[todayStr]);

  const generateCalendar = () => {
    const monthStart = toSeoulDate(startOfMonth(currentMonth));
    const monthEnd = toSeoulDate(endOfMonth(currentMonth));
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const allDays = eachDayOfInterval({ start, end });
    const rows = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    return rows;
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.container, { minHeight: screenHeight * 0.44 }]}
    >
      <View style={styles.weekDaysRow}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.clipper}>
        <Animated.View style={{ transform: [{ translateX: slideX }] }}>
          {generateCalendar().map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                const daySeoul = toSeoulDate(day);
                const dateStr = format(daySeoul, "yyyy-MM-dd");
                const entry = diariesByDate[dateStr] || null;
                const hasDiary = Boolean(entry);
                const isGenerating = entry?.status === "generating";

                let numericGenerationStartTime = null;
                const createdAtRaw = entry?.createdAt;

                if (isGenerating && createdAtRaw) {
                  if (typeof createdAtRaw === "string") {
                    const isoFormattedString = createdAtRaw.replace(" ", "T") + "Z";
                    const dateObject = new Date(isoFormattedString);
                    if (!isNaN(dateObject.getTime())) {
                      numericGenerationStartTime = dateObject.getTime();
                    } else {
                      console.warn(`[CalendarGrid] 날짜 문자열 파싱 실패: ${createdAtRaw}`);
                    }
                  } else if (typeof createdAtRaw === "number") {
                    numericGenerationStartTime = createdAtRaw;
                  } else {
                    console.warn(
                      `[CalendarGrid] 예상치 못한 createdAt 형식: ${typeof createdAtRaw}`,
                      createdAtRaw
                    );
                  }
                }

                const isCurrentMonth = isSameMonth(daySeoul, currentMonth);
                const isToday = dateStr === todayStr;
                const isFuture = daySeoul > todaySeoul;
                const isPast = !isFuture && !isToday;
                const isPastNoDiary = isPast && !hasDiary;
                const opacityStyle = isFuture ? { opacity: 0.3 } : null;

                let emotionSource = null;
                if (showEmotion && hasDiary && entry.emotionIcon) {
                  const found = characterList.find((c) => c.name === entry.emotionIcon);
                  emotionSource = found?.source ?? null;
                }

                const hasPhoto = hasDiary && entry.representativePhotoUrl;
                const isUnconfirmed = hasPhoto && entry.status === "unconfirmed";

                const handlePress = () => {
                  if (isGenerating) {
                    singleNavigate(`/loading/loadingDiary?date=${dateStr}`);
                    return;
                  }
                  if (hasDiary) {
                    singleNavigate(`/diary/${dateStr}`);
                  } else if (isPastNoDiary) {
                    if (selectedDate === dateStr) {
                      setSelectedDate(dateStr);
                      singleNavigate(`/create?date=${dateStr}&from=calendar`);
                    } else {
                      setSelectedDate(dateStr);
                    }
                  } else if (isToday) {
                    if (todayHasDiary) {
                      singleNavigate(`/diary/${dateStr}`);
                    } else {
                      singleNavigate(`/create?date=${dateStr}&from=calendar`);
                    }
                  }
                };

                const showText =
                  (!showEmotion || !hasDiary) &&
                  selectedDate !== dateStr &&
                  !(isToday && !todayHasDiary);

                return (
                  <TouchableOpacity
                    key={di}
                    style={[styles.dayContainer, opacityStyle]}
                    onPress={handlePress}
                    disabled={!isCurrentMonth}
                  >
                    {isGenerating ? (
                      <View style={styles.generatingWrapper}>
                        <GeneratingProgressCircle
                          size={DAY_ITEM_SIZE * 0.9}
                          duration={25000}
                          text={format(daySeoul, "d")}
                          startTime={numericGenerationStartTime}
                        />
                      </View>
                    ) : showEmotion && emotionSource ? (
                      <Image source={emotionSource} style={styles.dayEmotionIcon} />
                    ) : isToday && !todayHasDiary && selectedDate !== dateStr ? (
                      <Image
                        source={require("../../assets/icons/bigpinkplusicon.png")}
                        style={styles.plusIcon}
                      />
                    ) : hasDiary ? (
                      hasPhoto ? (
                        isUnconfirmed ? (
                          <LinearGradient
                            colors={["#D68089", "#FFBB91"]}
                            locations={[1, 0]}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={styles.gradientBorderWrapper}
                          >
                            <View style={styles.imageContainerForGradientBorder}>
                              <Image
                                source={{ uri: entry.representativePhotoUrl }}
                                style={styles.imageItselfInGradient}
                              />
                              <View style={styles.overlayItselfInGradient} />
                            </View>
                          </LinearGradient>
                        ) : (
                          <View style={styles.dayImageWrapper}>
                            <Image
                              source={{ uri: entry.representativePhotoUrl }}
                              style={styles.dayImage}
                            />
                            <View style={styles.dayImageOverlay} />
                          </View>
                        )
                      ) : (
                        <LinearGradient
                          colors={["#dad4ec", "#dad4ec", "#f3e7e9"]}
                          locations={[0, 0.01, 1]}
                          start={{ x: 0, y: 1 }}
                          end={{ x: 0, y: 0 }}
                          style={styles.dayStandardBackground}
                        />
                      )
                    ) : selectedDate === dateStr ? (
                      <Image
                        source={require("../../assets/icons/grayplusicon.png")}
                        style={styles.plusIcon}
                      />
                    ) : (
                      <View style={styles.dayPlaceholder} />
                    )}

                    {showText && (
                      <View style={styles.dayTextWrapper}>
                        <Text
                          style={[styles.actualDayText, !isCurrentMonth && styles.inactiveDayText]}
                        >
                          {format(daySeoul, "d")}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFEFE",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    width: "100%",
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingTop: 14
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15
  },
  weekDayText: {
    width: DAY_ITEM_SIZE,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#A78C7B",
    fontFamily: "Caveat_600SemiBold"
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  dayContainer: {
    width: DAY_ITEM_SIZE,
    height: DAY_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center"
  },
  generatingWrapper: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    justifyContent: "center",
    alignItems: "center"
  },
  generatingDayText: {
    fontSize: 18,
    color: "#D68089",
    fontFamily: "Inter_600SemiBold"
  },
  dayEmotionIcon: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.88
  },
  dayImage: {
    width: "100%",
    height: "100%"
  },
  dayPlaceholder: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
    backgroundColor: "transparent"
  },
  dayStandardBackground: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2
  },
  dayTextWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  actualDayText: {
    fontSize: 18,
    color: "#D68089",
    fontFamily: "Inter_600SemiBold"
  },
  inactiveDayText: {
    color: "rgba(214, 128, 137, 0.5)"
  },
  plusIcon: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9
  },
  dayImageWrapper: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  dayImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)"
  },
  gradientBorderWrapper: {
    width: DAY_ITEM_SIZE * 0.9,
    height: DAY_ITEM_SIZE * 0.9,
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 3
  },
  imageContainerForGradientBorder: {
    width: "100%",
    height: "100%",
    borderRadius: (DAY_ITEM_SIZE * 0.9) / 2 - 3,
    overflow: "hidden"
  },
  imageItselfInGradient: {
    width: "100%",
    height: "100%"
  },
  overlayItselfInGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)"
  },
  clipper: {
    overflow: "hidden",
    borderRadius: 30
  }
});
