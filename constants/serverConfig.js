import Constants from "expo-constants";

// app.json에서 BACKEND_URL 가져오기
const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || "https://diarypic.com";

// 서버 설정 상수들
export const SERVER_CONFIG = {
  // 개발 환경 설정
  development: {
    baseUrl: BACKEND_URL, // 로컬 개발 서버 URL
    healthCheckEndpoint: "/health",
    maintenanceCheckEndpoint: "/maintenance-status",
    timeout: 10000 // 10초
  },

  // 프로덕션 환경 설정
  production: {
    baseUrl: BACKEND_URL, // app.json의 BACKEND_URL 사용
    healthCheckEndpoint: "/health",
    maintenanceCheckEndpoint: "/maintenance-status",
    timeout: 10000 // 10초
  },

  // 스테이징 환경 설정 (프로덕션과 동일한 서버 사용)
  staging: {
    baseUrl: BACKEND_URL, // app.json의 BACKEND_URL 사용
    healthCheckEndpoint: "/health",
    maintenanceCheckEndpoint: "/maintenance-status",
    timeout: 10000 // 10초
  }
};

// 현재 환경 설정 (개발/프로덕션 자동 감지)
const getCurrentEnvironment = () => {
  if (__DEV__) {
    return "development";
  }
  // 실제 배포 시에는 환경변수나 다른 방법으로 구분
  return "production";
};

export const CURRENT_SERVER_CONFIG = SERVER_CONFIG[getCurrentEnvironment()];

// 서버 상태 확인 관련 설정
export const SERVER_STATUS_CONFIG = {
  // 자동 재시도 설정
  retryAttempts: 3,
  retryDelay: 2000, // 2초

  // 헬스체크 간격 (앱이 포그라운드에 있을 때)
  healthCheckInterval: 30000, // 30초

  // 백그라운드에서 포그라운드로 돌아올 때 자동 체크
  checkOnAppResume: true,

  // 에러 메시지 기본값
  defaultErrorMessages: {
    networkError: "네트워크 연결을 확인해주세요.",
    serverError: "서버에 일시적인 문제가 발생했습니다.",
    timeoutError: "서버 응답 시간이 초과되었습니다.",
    maintenanceMode: "현재 서비스 점검 중입니다."
  }
};

// 점검 모드 테스트용 객체 (개발 환경에서만 사용)
class TestMaintenanceMode {
  constructor() {
    this.enableMaintenance = false;
    this.maintenanceMessage = "테스트용 점검 메시지입니다.";
    this.simulateServerDown = false;
  }

  setMaintenanceMode(enabled, message = "테스트용 점검 메시지입니다.") {
    this.enableMaintenance = enabled;
    this.maintenanceMessage = message;
    this.simulateServerDown = false;
    console.log("Test maintenance mode set:", { enabled, message });
  }

  setServerDownMode(enabled) {
    this.simulateServerDown = enabled;
    this.enableMaintenance = false;
    console.log("Test server down mode set:", enabled);
  }

  reset() {
    this.enableMaintenance = false;
    this.simulateServerDown = false;
    this.maintenanceMessage = "테스트용 점검 메시지입니다.";
    console.log("Test modes reset");
  }
}

export const TEST_MAINTENANCE_MODE = __DEV__ ? new TestMaintenanceMode() : null;
