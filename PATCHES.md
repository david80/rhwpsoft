# RHWP STUDIO - 패치 이력 및 기술 아키텍처 기록 (PATCHES.md)

본 문서는 **RHWP STUDIO**에 적용된 커스텀 패치, 아키텍처 의사결정 내역, 그리고 업스트림 오픈소스 프로젝트([edwardkim/rhwp](https://github.com/edwardkim/rhwp))와의 동기화 로드맵을 기록 관리하는 문서입니다.

---

## 📌 패치 및 유지보수 원칙 (Patch Principles)

1. **비파괴성 (Non-destructive First)**
   - 문서 데이터(바이너리)의 원본 호환성을 1순위로 보호합니다.
   - 한컴오피스(한글) 정품 소프트웨어와의 양방향 호환을 위해, 에디터 조판 엔진의 버그를 우회하기 위해 원본 좌표 데이터를 임의로 이동/저장하여 문서를 손상시키지 않습니다.
2. **시각적 보정 (Visual Rendering Patch)**
   - 조판 엔진 버그로 인한 표/이미지 위치 오프셋은 **화면 렌더링 단계(Canvas/Renderer Layer)**에서 비파괴 방식으로 스마트하게 보정합니다.
3. **업스트림 동기화 (Upstream Alignment)**
   - "근본 패치는 나중에 깃허브 공식 저장소에 관련 패치가 머지/릴리즈될 경우 이를 가져와 패치한다"는 사용자 결정에 따라, Rust 조판 엔진 레벨의 근본 픽스가 출시되면 공식 WASM 엔진으로 매끄럽게 교체합니다.

---

## 📋 패치 목록 및 이력

### [PATCH-001] 스마트 서명 및 직인 위치 자동 보정 (Smart Signature & Stamp Alignment)
- **적용 일자**: 2026-09-29
- **영향 범위**: `public/studio/signature-snap-patch.js`, `public/studio/index.html`
- **관련 업스트림 이슈**: `edwardkim/rhwp` Issue #4068, #7363 (Floating picture vertical offset calculation relative to preceding table/paragraph `VertRelTo`)
- **문제 현상**:
  - `(25년신규과제) '26년 자체진도점검보고서...hwp`와 같이 표 바로 아래에 서명란(`연구책임자: 반 대 현 (인)`)이 있는 문서에서, 서명 이미지가 `(인)` 위치가 아니라 한참 위인 `5. 연구팀 건의사항 및 기타의견` 박스 내부로 치솟아 렌더링됨.
  - 한컴오피스 정품 소프트웨어에서는 정상 위치에 서명이 표시됨.
- **해결 방안 분석**:
  - *대안 1 (수동 좌표 수정 후 저장)*: 에디터에서 이미지를 아래로 끌어내려 저장할 경우, 원본 HWP 바이너리의 좌표가 변조되어 한컴오피스에서 다시 열었을 때 서명이 페이지 밖으로 튕겨 나가는 치명적인 부작용 발생.
  - *대안 2 (Rust 코어 조판 엔진 포크 빌드)*: 수천 줄의 `VertRelTo` 파싱 및 레이아웃 로직을 리버스 엔지니어링하여 직접 컴파일해야 하므로 소요 시간이 길고 업스트림 업데이트 시 충돌 위험.
  - *선택안 (렌더러 스마트 자동 스냅 패치)*:
    - 원본 데이터는 **1바이트도 수정하지 않음**.
    - Canvas 렌더러가 텍스트(`(인)`, `(서명)`, `( 직 인 )`, `[인]`)를 그릴 때 해당 위치를 추적.
    - 서명/도장 이미지(투명 PNG/JPG)가 그려질 때, 상단으로 어긋나 있는 이미지를 탐지하여 해당 `(인)` 위치의 Y축 기준선에 자연스럽게 스냅(Snap) 보정.
- **향후 계획**:
  - 공식 `rhwp` 깃허브 저장소에서 해당 버그에 대한 Rust 엔진 공식 릴리즈가 나오면, 본 렌더러 패치는 비활성화하고 공식 엔진 모듈로 판올림.

---

### [PATCH-002] 완전 오프라인 독립 번들화 및 포트 충돌 격리
- **적용 일자**: 2026-09-29
- **영향 범위**: `public/studio/*`, `vite.config.ts`, `src/services/editor-service.ts`
- **문제 현상**:
  - 원본 `rhwp-studio`는 `edwardkim.github.io` 원격 호스팅 자원이나 기본 `5173` 포트에 의존하여 다른 Vite 프로젝트와 포트 충돌이 발생하거나 폐쇄망/오프라인 환경에서 로딩 실패.
- **조치 사항**:
  - `rhwp-studio` 웹 번들, WASM(`rhwp_bg.wasm`), 기본 글꼴(KoPubWorld, Nanum 등) 일체를 `public/studio/` 로컬 디렉토리에 100% 내장.
  - 기본 실행 포트를 충돌 없는 **`7788`**로 지정.
  - Electron 패키징 시 로컬 Loopback 서버(`127.0.0.1`)를 자체 구동하여 `file://` 프로토콜의 WebAssembly/CORS 제약을 원천 해결.

---

### [PATCH-003] 데스크톱 앱 종료 프로세스 잔류 이슈 해결 (Exit & Lifecycle)
- **적용 일자**: 2026-09-29
- **영향 범위**: `electron/main.ts`
- **문제 현상**:
  - `rhwp-studio` 내부의 `window.onbeforeunload` (저장되지 않은 변경사항 가드) 핸들러가 Electron 창 닫기 이벤트를 가로막아, 창은 닫혔으나 백그라운드 프로세스가 영구 잔류하는 현상 발생.
- **조치 사항**:
  - `webContents.on('will-prevent-unload')` 이벤트를 인터셉트하여 `event.preventDefault()` 처리.
  - 창 닫힘 및 메뉴 단축키(`Cmd+Q`, `Ctrl+Q`) 발생 시 `app.exit(0)`을 강제 호출하여 클린 종료 보장.

---

### [PATCH-004] Apple Silicon 및 Windows 크로스 컴파일 빌드 파이프라인 패치
- **적용 일자**: 2026-09-29
- **영향 범위**: `package.json`, `electron-builder`, `scripts/`
- **문제 현상**:
  - macOS Apple Silicon(M1/M2/M3/M4) 환경에서 `electron-builder`가 번들링된 x86 wine/makensis를 실행할 때 `dyld: __thread_starts section missing` 크래시 발생.
  - 미서명 앱 실행 시 macOS Gatekeeper "손상되어 열 수 없습니다" 에러 발생.
- **조치 사항**:
  - Windows 빌드 설정에 `signAndEditExecutable: false` 적용 및 Homebrew의 최신 ARM64 네이티브 `makensis` (v3.12) 심볼릭 링크 연동.
  - 자체 서명 인증서 생성 도구(`scripts/create-self-signed-cert.sh`) 및 macOS 격리 속성 해제 스크립트(`scripts/fix-macos-quarantine.sh`) 탑재.
  - 최종 산출물: macOS `.dmg`, `.pkg` 및 Windows `Setup.exe` (NSIS), `Portable.exe` 원클릭 생성 파이프라인 완성.

---

### [PATCH-005] 고품질 다국어 (i18n) 시스템 및 모던 다크 글래스 UI
- **적용 일자**: 2026-09-29
- **영향 범위**: `src/i18n/*`, `src/styles/app.css`, `index.html`
- **내용**:
  - 한국어(KO) 및 영어(EN) 원클릭 토글 지원.
  - 뷰어 모드 / 에디터 모드 실시간 전환.
  - 단축키 안내 및 문서 메타데이터 진단 모달 제공.
