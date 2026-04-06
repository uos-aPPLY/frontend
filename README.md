# DiaryPic Frontend

DiaryPic의 Expo/React Native 프론트엔드 앱입니다.

사용자가 사진을 선택하거나 직접 일기를 작성하면,

- 사진 기반 AI 일기 생성
- 베스트샷/포커스 키워드 설정
- 일기 수정 및 AI 수정
- 캘린더/앨범/검색/알림

기능을 통해 하루를 기록할 수 있도록 구성되어 있습니다.

## 기술 스택

- `Expo 53`
- `React Native 0.79`
- `React 19`
- `expo-router`
- `react-native-paper`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-draggable-flatlist`
- `react-native-webview`
- `expo-notifications`
- `date-fns`, `date-fns-tz`

## 실행 환경

- Node.js 18+ 권장
- npm 사용 기준
- iOS 개발은 Xcode가 필요합니다.
- Android 개발은 Android Studio / SDK가 필요합니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 앱 실행

이 프로젝트의 기본 실행 스크립트는 dev client 기준입니다.

```bash
npm run start
```

필요 시 플랫폼별 실행:

```bash
npm run ios
npm run android
npm run web
```

참고:

- `package.json`의 `start`는 `expo start --dev-client`입니다.
- Expo Go 기준 프로젝트가 아니라 dev build 기준으로 보는 편이 안전합니다.

## 앱 설정

주요 Expo 설정은 [app.json](/Users/dongchan/Desktop/Project/diarypic-fe/app.json)에 있습니다.

현재 포함된 주요 설정:

- 앱 이름/버전/빌드 번호
- iOS 번들 ID / Android 패키지명
- `expo-router` 엔트리
- 알림, Apple 로그인, Naver/Kakao 로그인 설정
- 백엔드 URL

중요:

- 현재 `app.json`의 `expo.extra`에는 외부 서비스 키가 포함되어 있습니다.
- 운영 저장소에서는 민감정보를 그대로 커밋하지 않는 구성이 더 바람직합니다.

## 주요 스크립트

`package.json` 기준:

```bash
npm run start     # expo start --dev-client
npm run ios       # expo run:ios
npm run android   # expo run:android
npm run web       # expo start --web
```

## 프로젝트 구조

### 라우트

`app/`

- `app/_layout.js`
  앱 최상위 레이아웃, 인증/온보딩/서버 상태 분기
- `app/(tabs)/`
  홈, 캘린더, 프로필 탭
- `app/(onboarding)/`
  약관, 닉네임, 말투, 튜토리얼
- `app/create.js`
  날짜 기준 새 일기 작성 진입 화면
- `app/write.js`
  직접 일기 쓰기
- `app/generate.js`
  AI 일기 생성 전 포커스 키워드 설정
- `app/loading/`
  사진 업로드/AI 생성 대기 화면
- `app/diary/[date].js`
  일기 상세
- `app/edit.js`
  일기 수정
- `app/editWithAi.js`
  AI 기반 일기 수정
- `app/search.js`
  검색 화면

### 공통 UI

`components/`

- `Header/*`
  각 화면 헤더
- `Calendar/*`
  캘린더 그리드, 월 이동, 연/월 선택
- `EditImageSlider.jsx`
  수정/직접쓰기용 사진 슬라이더 및 인라인 reorder
- `ImageSlider.jsx`
  상세/AI 수정용 이미지 슬라이더
- `Settings/NotificationSettings.jsx`
  알림 설정
- `Modal/*`
  공용 모달

### 상태 관리

`contexts/`

- `AuthContext.js`
  로그인, 토큰, 인증 fetch 처리
- `DiaryContext.js`
  현재 편집/조회 중인 일기 상태
- `PhotoContext.js`
  사진 선택/임시 사진/대표 사진 상태
- `ServerStatusContext.js`
  점검/서버 상태 확인

## 핵심 사용자 흐름

### 1. 새 일기 작성

- 홈 또는 캘린더에서 날짜 선택
- `create`
- 사진 없이 저장하거나
- 사진 선택 후 `write` 또는 `generate`로 이동

### 2. 직접 일기 쓰기

- 사진 선택
- 대표 사진 지정
- 사진 순서 조정
- 감정 캐릭터 선택
- 본문 작성 후 저장

### 3. AI 일기 생성

- 사진 선택
- 포커스 키워드 지정
- AI 생성 요청
- 생성 완료 후 상세 화면 이동

### 4. 일기 수정

- 기존 일기 상세 진입
- 일반 수정 또는 AI 수정
- 사진 재정렬, 대표 사진 변경, 본문 수정

## 최근 반영된 주요 UX 방향

- 사진 순서 변경은 별도 화면보다 인라인 drag 방식 중심
- 키보드가 입력 영역을 가리지 않도록 자동 스크롤 보강
- AI 수정 비교 화면에서 변경 부분 하이라이트
- 사진 상세 보기에서 핀치 줌/드래그 지원
- 검색 화면은 일반 스택 push보다 검색에 맞는 전환 사용

## 개발 시 참고

### 알림

- `expo-notifications`를 사용합니다.
- 시뮬레이터 알림 테스트는 실제 기기와 다를 수 있습니다.
- 최종 확인은 실기기 dev build/TestFlight/App Store 환경 기준으로 보는 것이 안전합니다.

### 인증

- 인증 관련 공통 처리는 `AuthContext`에 모여 있습니다.
- 화면에서 토큰을 직접 다루기보다 컨텍스트 경로를 우선 사용하는 편이 안전합니다.

### 날짜 처리

- 캘린더/월별 보기/일기 조회는 날짜 문자열(`yyyy-MM-dd`)과 locale/timezone 처리가 섞여 있습니다.
- 날짜 로직 수정 시 `create`, `calendar`, `diary`, `loadingDiary` 흐름을 같이 봐야 합니다.

### AI 수정 에디터

- AI 수정 화면은 `WebView` 기반 편집기(`assets/html/editor.html`)를 사용합니다.
- RN 텍스트 입력과 달리 WebView 메시지 통신(`postMessage`)을 통해 편집 상태를 주고받습니다.

## 문서화되지 않은 점

현재 저장소에는 테스트/린트 스크립트가 따로 없습니다.

즉, 변경 검증은 주로 아래 방식으로 이뤄집니다.

- `npx expo export --platform ios --output-dir .expo-export-check`
- 시뮬레이터/실기기 수동 확인

## 협업 가이드

- main 브랜치 직접 푸시는 피합니다.
- 작업 단위별 브랜치를 분리합니다.
- PR 단위는 가능한 작게 유지합니다.
- 새 브랜치는 최신 main 기준으로 생성하는 편이 좋습니다.

## 기타

- 미사용 라우트였던 `app/photoReorder.js`는 제거된 상태입니다.
- 검색 화면은 `app/_layout.js`에서 별도 스크린 옵션으로 관리합니다.
- 루트 엔트리는 `App.js`가 아니라 `expo-router/entry`입니다.
