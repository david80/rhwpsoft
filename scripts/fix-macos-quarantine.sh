#!/bin/bash
# macOS Gatekeeper quarantine 속성 해제 스크립트
# 다운로드 후 "확인되지 않은 개발자" 경고가 뜨는 경우 실행

APP_PATH="/Applications/RHWP STUDIO.app"

if [ ! -d "$APP_PATH" ]; then
  # 현재 디렉토리의 release 폴더 탐색
  if [ -d "./release/mac-arm64/RHWP STUDIO.app" ]; then
    APP_PATH="./release/mac-arm64/RHWP STUDIO.app"
  fi
fi

if [ -d "$APP_PATH" ]; then
  echo "🚀 '$APP_PATH' 격리 속성(Quarantine)을 제거합니다..."
  xattr -cr "$APP_PATH"
  echo "✅ 완료되었습니다! 이제 RHWP STUDIO를 경고 없이 즉시 실행할 수 있습니다."
  open "$APP_PATH"
else
  echo "❌ '$APP_PATH' 앱을 찾을 수 없습니다. 설치 여부를 확인해주세요."
fi
