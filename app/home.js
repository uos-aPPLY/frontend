// app/home.js
import React from "react";
import { Redirect } from "expo-router";

export default function HomeRedirect() {
  // /home 에 진입하면 바로 '/'로 리다이렉트
  return <Redirect href="/" />;
}
