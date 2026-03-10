# Repository for aPPLY Front-end

## 초기 설정

```
# Expo Go 로그인
npx expo login

# iOS, Android 빌드
npx expo prebuild
npx expo run:ios
npx expo run:android

# 실행
npx expo start
npx expo start --dev-client -c
npx expo start --no-dev --minify

# 설치
npm install
npm install -g expo
npm install -g eas-cli
npx expo install expo-dev-client
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-image-picker expo-auth-session expo-secure-store @react-native-seoul/kakao-login
npm install axios
npx expo install expo-build-properties
npx expo install @expo-google-fonts/caveat expo-font
npx expo install @expo-google-fonts/homemade-apple expo-font
npx expo install @react-native-google-signin/google-signin
npm install query-string@6
npx expo install @react-native-seoul/naver-login
npm install react-native-modal
npx expo install expo-image-manipulator
npm install date-fns --save
npx expo install @expo-google-fonts/inter
npx expo install expo-notifications
npm install react-native-draggable-flatlist
npx expo install react-native-gesture-handler
npx expo install react-native-reanimated
npx expo install expo-splash-screen
npx expo install react-native-webview
npm install fast-uri
npx expo install expo-linear-gradient
npx expo install react-native-safe-area-context
npx expo install expo-haptics
npx expo install react-native-svg
npx expo install expo-media-library
npx expo install react-native-paper react-native-vector-icons
npx expo install react-native-render-html
npx expo install expo-apple-authentication expo-random
npx expo install expo-store-review
npm install date-fns-tz
npx expo install expo-localization

```

## Prettier 설정

- 코드 포맷팅 통일
- vscode extension(Ctrl or Command + Shift + X)에서 Prettier 설치
- 설정(Ctrl or Command + ,)에서 Default Formatter로 Prettier - Code formatter를 선택
- Format On Save 옵션 체크
- 이후 저장할 때마다 formatting이 잘 되는지 확인(세미콜론이 모든 코드 끝에 생성되고 불필요한 공백 등이 사라지게 됨)

## 가이드

- [Notion](https://www.notion.so/1addeb51139880128b59e2ad0d877c9c?pvs=4)에서 새로운 업무 단위마다 티켓을 생성 후, Decription에 어떤 내용인지 작성하기
- 각 티켓의 ID명과 동일한 branch를 생성하기
- 개별 branch에서 작업을 모두 한 뒤, 모든 commit을 push하고 github에서 PR(Pull Request)하기
- 하나의 branch의 내용이 너무 많지 않도록 하기(한 branch에는 하나의 작업을 하도록 하기)
- 새로운 branch를 만들때, main branch에서 git pull 하고 생성하기
- [Commit message convention](https://velog.io/@jiheon/Git-Commit-message-%EA%B7%9C%EC%B9%99)을 따르기
- 주의: **main branch에 절대 push 금지🚫**
