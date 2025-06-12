import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert, AppState } from "react-native";
import {
  CURRENT_SERVER_CONFIG,
  SERVER_STATUS_CONFIG,
  TEST_MAINTENANCE_MODE
} from "../constants/serverConfig";

const ServerStatusContext = createContext();

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error("useServerStatus must be used within a ServerStatusProvider");
  }
  return context;
};

export const ServerStatusProvider = ({ children }) => {
  const [serverStatus, setServerStatus] = useState({
    isOnline: null, // null: checking, true: online, false: offline
    isUnderMaintenance: false,
    maintenanceMessage: "",
    lastChecked: null,
    error: null
  });

  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 타임아웃이 있는 fetch 함수 생성 (React Native 호환)
  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  };

  const checkServerHealth = async (isRetry = false) => {
    setIsChecking(true);

    try {
      // 개발 환경에서 테스트 모드 확인
      if (TEST_MAINTENANCE_MODE?.simulateServerDown) {
        console.log("Simulating server down for testing");
        throw new Error("Simulated server down for testing");
      }

      if (TEST_MAINTENANCE_MODE?.enableMaintenance) {
        console.log("Simulating maintenance mode for testing");
        setServerStatus({
          isOnline: true,
          isUnderMaintenance: true,
          maintenanceMessage: TEST_MAINTENANCE_MODE.maintenanceMessage,
          lastChecked: new Date(),
          error: null
        });
        setRetryCount(0);
        return;
      }

      // 헬스체크 API 호출
      const healthCheckUrl = `${CURRENT_SERVER_CONFIG.baseUrl}${CURRENT_SERVER_CONFIG.healthCheckEndpoint}`;
      console.log("healthCheckUrl", healthCheckUrl);
      const healthResponse = await fetchWithTimeout(
        healthCheckUrl,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        },
        CURRENT_SERVER_CONFIG.timeout
      );

      if (healthResponse.ok) {
        // 헬스체크 응답 내용 확인 (응답이 "OK"인지 확인)
        const healthResponseText = await healthResponse.text();
        if (healthResponseText.trim() !== "OK") {
          throw new Error(`Health check failed: Expected "OK", received "${healthResponseText}"`);
        }

        // 점검 모드 확인
        const maintenanceUrl = `${CURRENT_SERVER_CONFIG.baseUrl}${CURRENT_SERVER_CONFIG.maintenanceCheckEndpoint}`;
        const maintenanceResponse = await fetchWithTimeout(
          maintenanceUrl,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          },
          5000
        );

        let isUnderMaintenance = false;
        let maintenanceMessage = "";

        if (maintenanceResponse.ok) {
          try {
            const maintenanceData = await maintenanceResponse.json();
            // API가 단순히 boolean 값(true/false)을 반환하는 경우
            if (typeof maintenanceData === "boolean") {
              isUnderMaintenance = maintenanceData;
              maintenanceMessage = maintenanceData ? "현재 서비스 점검 중입니다." : "";
            }
            // API가 객체 형태로 반환하는 경우 (기존 코드와의 호환성)
            else if (typeof maintenanceData === "object" && maintenanceData !== null) {
              isUnderMaintenance = maintenanceData.isUnderMaintenance || maintenanceData === true;
              maintenanceMessage =
                maintenanceData.message || (isUnderMaintenance ? "현재 서비스 점검 중입니다." : "");
            }
          } catch (parseError) {
            console.warn("Failed to parse maintenance response:", parseError);
            // 파싱에 실패하면 점검 모드가 아닌 것으로 간주
            isUnderMaintenance = false;
            maintenanceMessage = "";
          }
        }

        const newServerStatus = {
          isOnline: true,
          isUnderMaintenance,
          maintenanceMessage,
          lastChecked: new Date(),
          error: null
        };

        console.log("Setting new serverStatus:", newServerStatus);
        setServerStatus(newServerStatus);

        // 성공 시 재시도 카운트 리셋
        setRetryCount(0);
      } else {
        throw new Error(`Server responded with status: ${healthResponse.status}`);
      }
    } catch (error) {
      console.error("Server health check failed:", error);

      let errorMessage = SERVER_STATUS_CONFIG.defaultErrorMessages.serverError;

      if (
        error.name === "AbortError" ||
        error.message.includes("timeout") ||
        error.message.includes("Request timeout")
      ) {
        errorMessage = SERVER_STATUS_CONFIG.defaultErrorMessages.timeoutError;
      } else if (
        error.message.includes("Network request failed") ||
        error.message.includes("fetch")
      ) {
        errorMessage = SERVER_STATUS_CONFIG.defaultErrorMessages.networkError;
      }

      setServerStatus({
        isOnline: false,
        isUnderMaintenance: false,
        maintenanceMessage: "",
        lastChecked: new Date(),
        error: errorMessage
      });

      // 자동 재시도 로직
      if (!isRetry && retryCount < SERVER_STATUS_CONFIG.retryAttempts) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          checkServerHealth(true);
        }, SERVER_STATUS_CONFIG.retryDelay);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const retryConnection = () => {
    setRetryCount(0);
    checkServerHealth();
  };

  const forceMaintenanceMode = (message = "현재 서버 점검 중입니다.") => {
    console.log("Forcing maintenance mode with message:", message);

    // 개발 환경에서 테스트 모드 설정
    if (TEST_MAINTENANCE_MODE) {
      TEST_MAINTENANCE_MODE.setMaintenanceMode(true, message);
    }

    setServerStatus((prev) => ({
      ...prev,
      isOnline: true,
      isUnderMaintenance: true,
      maintenanceMessage: message,
      error: null
    }));
  };

  const clearMaintenanceMode = () => {
    console.log("Clearing maintenance mode");

    // 개발 환경에서 테스트 모드 리셋
    if (TEST_MAINTENANCE_MODE) {
      TEST_MAINTENANCE_MODE.reset();
    }

    setServerStatus((prev) => ({
      ...prev,
      isUnderMaintenance: false,
      maintenanceMessage: "",
      error: null
    }));
  };

  const forceServerDownMode = () => {
    console.log("Forcing server down mode");

    // 개발 환경에서 테스트 모드 설정
    if (TEST_MAINTENANCE_MODE) {
      TEST_MAINTENANCE_MODE.setServerDownMode(true);
    }

    setServerStatus((prev) => ({
      ...prev,
      isOnline: false,
      isUnderMaintenance: false,
      maintenanceMessage: "",
      error: "테스트용 서버 다운 시뮬레이션"
    }));
  };

  // 앱 상태 변경 감지 (백그라운드에서 포그라운드로 돌아올 때 재확인)
  useEffect(() => {
    if (!SERVER_STATUS_CONFIG.checkOnAppResume) return;

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active" && serverStatus.isOnline === false) {
        // 앱이 활성화되고 서버가 다운 상태일 때 재확인
        setTimeout(() => {
          checkServerHealth();
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [serverStatus.isOnline]);

  // 초기 서버 상태 확인
  useEffect(() => {
    checkServerHealth();
  }, []);

  const value = {
    serverStatus,
    isChecking,
    retryCount,
    checkServerHealth,
    retryConnection,
    forceMaintenanceMode,
    clearMaintenanceMode,
    forceServerDownMode
  };

  return <ServerStatusContext.Provider value={value}>{children}</ServerStatusContext.Provider>;
};
