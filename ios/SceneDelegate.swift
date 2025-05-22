//
//  SceneDelegate.swift
//  diarypic
//
//  Created by Dongchan Park on 5/20/25.
//

import Foundation

import UIKit
import React
import KakaoSDKAuth
import KakaoSDKCommon

@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  var window: UIWindow?

  func scene(_ scene: UIScene,
             willConnectTo session: UISceneSession,
             options connectionOptions: UIScene.ConnectionOptions) {

    guard let windowScene = scene as? UIWindowScene else { return }

    if let appDelegate = UIApplication.shared.delegate as? AppDelegate,
       let win = appDelegate.window {

      win.windowScene = windowScene
      self.window = win
    }
  }

  func scene(_ scene: UIScene,
             openURLContexts URLContexts: Set<UIOpenURLContext>) {

    guard let url = URLContexts.first?.url else { return }

    // Kakao SDK가 처리할 수 있으면 여기서 종료
    if AuthController.handleOpenUrl(url: url) { return }

    // 그 밖의 딥링크는 React Native로 전달
    RCTLinkingManager.application(
      UIApplication.shared,
      open: url,
      options: [:]
    )
  }

  // 생명주기 메서드(필요 없으면 비워 둠)
  func sceneDidDisconnect(_ scene: UIScene) { }
  func sceneDidBecomeActive(_ scene: UIScene) { }
  func sceneWillResignActive(_ scene: UIScene) { }
  func sceneWillEnterForeground(_ scene: UIScene) { }
  func sceneDidEnterBackground(_ scene: UIScene) { }
}
