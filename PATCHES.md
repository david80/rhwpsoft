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

### [PATCH-001] 스마트 서명 및 직인 위치 자동 보정 (Smart Signature & Stamp Alignment v5)
- **적용 일자**: 2026-09-29
- **영향 범위**: `public/studio/assets/index-sZn36s00.js`, `public/studio/signature-snap-patch.js`, `public/studio/index.html`
- **관련 업스트림 이슈**: `edwardkim/rhwp` Issue #4068, #7363 (Floating picture vertical offset calculation relative to preceding table/paragraph `VertRelTo`)
- **문제 원인 정밀 분석**:
  1. **HWP 문단 기준 부유 객체 좌표 계산 버그**: HWP 바이너리 규격에서 표가 포함된 문단(`paraIdx`)에 속한 부유형(floating) 그림의 Y 좌표(`vertOffset`)는 표 내부의 행/셀을 기준으로 계산되어야 하나, 오픈소스 `rhwp` v0.8.6 엔진은 직전 문단 끝점(`y: 398.9`)을 기준으로 렌더링하여 이미지가 직전 상단 박스로 치솟는 현상 발생.
  2. **Canvas2D 다중 캔버스 분리 렌더링**: Canvas2D 모드에서는 텍스트 본문 캔버스(`flow`)와 서명 이미지 오버레이 캔버스(`front`)가 분리되어 있어, 기존 단일 캔버스 `fillText` 후킹 방식으로는 앵커를 전달받지 못함.
  3. **`(인)` 글자 분할 및 전각 공백**: HWP 조판 시 `(인)` 텍스트가 `　(` (전각 공백 + 괄호)와 `인)` 2개의 분할된 `textRun`으로 나뉘어 렌더링되어 단순 정규식이 매칭되지 않음.
- **해결 방안 (4단계 통합 스마트 정렬 아키텍처)**:
  - **1단계 (컨트롤 레이아웃 기반 분석)**: `getPageControlLayout(pageIdx)`에서 페이지 내 모든 표와 셀(좌표, 너비, 높이)을 조회하여, 가로 축으로 서명 이미지 중심과 겹치는 하단 서명란 셀(`반 대 현 (인)`)을 정확히 산출.
  - **2단계 (Canvas2D drawImage 렌더링 인터셉트)**: `renderPageToCanvasFiltered` 실행 시 페이지/캔버스/배율 컨텍스트를 추적하여, WASM이 `ctx.drawImage`로 서명 이미지를 그릴 때 목표 셀 중심 Y 좌표(`516.25px`)로 픽셀 단위 정밀 보정.
  - **3단계 (CanvasKit 및 계층 트리 동기화)**: `getPageLayerTree` 및 `getPageLayerTreeWithProfile`에서 이미지 노드의 `bounds.y`와 `bbox.y`를 보정하여 CanvasKit 렌더링 및 내보내기 시에도 완벽 일치.
  - **4단계 (에디터 모드 개체 선택/드래그 연동)**: `getPageControlLayout`의 이미지 좌표를 동기화하여 에디터 모드에서 서명을 클릭했을 때 선택 핸들과 바운딩 박스가 정확한 위치에 표시되고 드래그가 정상 작동하도록 구현.
  - **100% 원본 바이너리 보존**: HWP 파일 내부 바이너리 데이터는 단 1바이트도 변경하지 않으므로, 한컴오피스 정품 소프트웨어와의 양방향 호환성을 완벽하게 유지.
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

---

### [PATCH-006] 업스트림 rhwp v0.8.7 동기화 및 엔진 판올림 (Upstream v0.8.7 Sync)
- **적용 일자**: 2026-10-08
- **영향 범위**: `package.json`, `public/rhwp_bg.wasm`, `public/studio/*`, `index.html`, `src/i18n/locales.ts`
- **업스트림 릴리즈**: [edwardkim/rhwp v0.8.7](https://github.com/edwardkim/rhwp/releases/tag/v0.8.7)
- **주요 동기화 내역**:
  1. **npm 패키지 업데이트**: `@rhwp/core@0.8.7`, `@rhwp/editor@0.8.7` 적용.
  2. **WASM 코어 교체**: v0.8.7 Rust 공식 컴파일 WASM(`rhwp_bg.wasm`, sha256 `54cf9501...`)으로 갱신.
  3. **Studio 독립 번들 갱신**:
     - v0.8.7 신규 Studio 웹 번들(`assets/index-zNX2Cct6.js`, `index-CJqHfaJX.css`, `canvaskit-renderer-qwNCZ9x6.js`, `locale-init.js` 등) 탑재.
     - 오프라인/로컬 완전 독립 환경을 위한 상대 경로(`./`) 및 URL import 패치 적용.
  4. **조판 및 표 레이아웃 개선사항 반영**:
     - 문단 안 연속 TAC 표의 저장 줄 소속과 가용 폭, 바깥여백 반영 (#7482, #7585)
     - rowspan·중첩 표 페이지 분할 안정화 (#7368, #7567, #7570)
     - 빈 머리말/꼬리말 HWP5 한컴 열기 호환성 및 표 제목 줄 반복 저장 보정 (#7338, #7460)
     - 입력 안전성 및 fuzz 발견 비정상 경계 방어 강화 (#7263, #7602)

