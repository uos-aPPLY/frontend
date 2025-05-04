import React from "react";
import styled from "styled-components/native";

const S = {
  Container: styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: #ffffff;
  `,
  KakaoButton: styled.TouchableOpacity`
    background-color: #fee500;
    padding-vertical: 12px;
    padding-horizontal: 24px;
    border-radius: 8px;
    align-items: center;
  `,
  ButtonText: styled.Text`
    color: #3c1e1e;
    font-size: 16px;
    font-weight: 600;
  `,
};

const LoginScreen = () => {
  const handlePress = () => {};

  return (
    <S.Container>
      <S.KakaoButton onPress={handlePress} activeOpacity={0.8}>
        <S.ButtonText>카카오로 시작하기</S.ButtonText>
      </S.KakaoButton>
    </S.Container>
  );
};

export default LoginScreen;
