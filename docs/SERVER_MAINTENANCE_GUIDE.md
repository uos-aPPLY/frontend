# 서버 점검 모드 기능 가이드

## 개요

앱 서버 점검이나 서버 다운 시 Splash Screen에서 사용자의 앱 내부 접근을 차단하는 기능입니다.

## 주요 기능

### 1. 서버 상태 자동 감지

- 앱 시작 시 서버 헬스체크 자동 실행
- 서버 응답 상태에 따른 자동 처리
- 백그라운드에서 포그라운드로 돌아올 때 재확인

### 2. 점검 모드 지원

- 서버에서 점검 모드 플래그 확인
- 사용자 정의 점검 메시지 표시
- 점검 완료 시 자동 복구

### 3. 오류 처리 및 재시도

- 네트워크 오류, 타임아웃 등 다양한 오류 상황 처리
- 자동 재시도 로직 (최대 3회)
- 사용자 수동 재시도 기능

## 파일 구조

```
contexts/
├── ServerStatusContext.js          # 서버 상태 관리 Context
constants/
├── serverConfig.js                 # 서버 설정 파일
components/
├── MaintenanceScreen.js            # 점검/오류 화면 컴포넌트
├── DeveloperMenu.js               # 개발자 테스트 메뉴 (개발환경 전용)
app/
├── _layout.js                     # 메인 레이아웃 (서버 상태 체크 통합)
```

## 설정 방법

### 1. 서버 엔드포인트 설정

서버 URL은 `app.json`의 `extra.BACKEND_URL`에서 자동으로 가져옵니다:

```json
// app.json
{
  "expo": {
    "extra": {
      "BACKEND_URL": "https://diarypic.com"
    }
  }
}
```

`constants/serverConfig.js`에서는 이 값을 자동으로 사용합니다:

```javascript
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || "https://diarypic.com";

export const SERVER_CONFIG = {
  production: {
    baseUrl: BACKEND_URL, // app.json의 BACKEND_URL 자동 사용
    healthCheckEndpoint: "/health",
    maintenanceCheckEndpoint: "/maintenance-status",
    timeout: 10000
  }
  // ...
};
```

### 2. 서버 API 구현

서버에서 다음 엔드포인트들을 구현해야 합니다:

#### 헬스체크 API

```
GET /health
Response:
- Status: 200 OK
- Body: "OK" (텍스트)
```

#### 점검 상태 확인 API

```
GET /maintenance-status
Response:
- Status: 200 OK
- Body: true 또는 false (boolean)
  - true: 점검 중
  - false: 점검 중 아님
```

## 사용자 경험 플로우

### 정상 상태

1. 앱 시작
2. 서버 헬스체크 실행
3. 서버 정상 → 앱 정상 진입

### 점검 모드

1. 앱 시작
2. 서버 헬스체크 실행
3. 점검 모드 감지 → 점검 화면 표시
4. "다시 확인하기" 버튼으로 재시도 가능

### 서버 다운

1. 앱 시작
2. 서버 헬스체크 실행
3. 서버 응답 없음 → 오류 화면 표시
4. 자동 재시도 (최대 3회)
5. "다시 시도" 버튼으로 수동 재시도 가능

## 개발자 테스트 기능

개발 환경에서는 화면 우측 상단에 개발자 메뉴 버튼이 표시됩니다.

### 테스트 기능

- **점검 모드 시뮬레이션**: 강제로 점검 모드 활성화/해제
- **서버 상태 확인**: 현재 서버 상태 실시간 모니터링
- **수동 재시도**: 서버 상태 재확인 버튼

### 테스트 방법

1. 개발자 메뉴 버튼 클릭 (벌레 아이콘)
2. "점검 모드 활성화" 버튼 클릭
3. 앱이 점검 화면으로 전환되는지 확인
4. "점검 모드 해제" 버튼으로 정상 복구 확인

## 커스터마이징

### 1. 점검 화면 디자인 변경

`components/MaintenanceScreen.js` 파일에서 UI 수정 가능

### 2. 재시도 설정 변경

`constants/serverConfig.js`의 `SERVER_STATUS_CONFIG`에서 설정:

```javascript
export const SERVER_STATUS_CONFIG = {
  retryAttempts: 3, // 재시도 횟수
  retryDelay: 2000, // 재시도 간격 (ms)
  healthCheckInterval: 30000, // 헬스체크 간격 (ms)
  checkOnAppResume: true // 앱 복귀 시 자동 체크
};
```

### 3. 에러 메시지 커스터마이징

`SERVER_STATUS_CONFIG.defaultErrorMessages`에서 기본 에러 메시지 수정

## 주의사항

1. **서버 엔드포인트**: 실제 서버 URL로 변경 필요
2. **네트워크 보안**: HTTPS 사용 권장
3. **타임아웃 설정**: 네트워크 환경에 맞게 조정
4. **개발자 메뉴**: 프로덕션 빌드에서는 자동으로 숨겨짐

## 트러블슈팅

### 서버 연결 실패가 계속되는 경우

1. 서버 URL이 올바른지 확인
2. 네트워크 연결 상태 확인
3. 서버의 CORS 설정 확인
4. 타임아웃 설정 조정

### 점검 모드가 해제되지 않는 경우

1. 서버의 maintenance-status API 응답 확인
2. 개발자 메뉴에서 수동으로 해제
3. 앱 재시작

## 배포 체크리스트

- [x] ~~실제 서버 URL로 변경~~ (app.json에서 자동 설정됨)
- [x] 서버 헬스체크 API 구현 완료 (`https://diarypic.com/health`)
- [x] 점검 상태 API 구현 완료 (`https://diarypic.com/maintenance-status`)
- [ ] 타임아웃 설정 최적화
- [ ] 에러 메시지 현지화
- [x] 점검 화면 디자인 최종 확인
