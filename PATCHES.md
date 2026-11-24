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

---

### [PATCH-007] 업스트림 rhwp v0.9.0 동기화 및 서명 보정 패치 재적용 (Upstream v0.9.0 Sync)
- **적용 일자**: 2026-11-16
- **영향 범위**: `package.json`, `public/rhwp_bg.wasm`, `public/studio/*`, `index.html`, `README*.md`, `src/i18n/locales.ts`
- **업스트림 릴리즈**: [edwardkim/rhwp v0.9.0](https://github.com/edwardkim/rhwp/releases/tag/v0.9.0) (태그 `c9095c5f`)
- **주요 동기화 내역**:
  1. **npm 패키지 업데이트**: `@rhwp/core@0.9.0`, `@rhwp/editor@0.9.0` 적용, 앱 버전 1.0.2.
  2. **WASM 코어 교체**:
     - `public/rhwp_bg.wasm`: npm `@rhwp/core@0.9.0` 공식 WASM (sha256 `c3b0632b...`).
     - `public/studio/*`: v0.9.0 호스팅 Studio 빌드 WASM (sha256 `39671924...`, PDF 가져오기 포함). Studio 번들은 자체 JS 글루와 짝이 맞는 이 WASM을 사용.
  3. **Studio 독립 번들 갱신**:
     - 신규 번들 `assets/index-DgYYBpxg.js`, `index-heovRvTs.css`, `canvaskit-renderer-Z7SVSenC.js`, PDF `import-worker`, `form-action-worker`, 플러그인 청크 등 탑재 (`canvaskit-SCAxUyCS.wasm`은 동일 해시로 유지).
     - 신규 글꼴 5종 추가: `RHWPPublicBatang`, `RHWPOldHangul`, `NotoSansMath`, `NotoSansSymbols2`, `LatinModernMath` subset.
     - 호스팅 빌드의 절대 경로(`/rhwp/`)를 오프라인용 상대 경로로 치환: `index.html`·`registerSW.js`는 `./`, CSS는 `../`, Worker/WASM `new URL(...)`은 모듈 기준 파일명, Vite preload base는 `../`, CanvasKit WASM은 `new URL(..., import.meta.url)`.
  4. **[PATCH-001 v6] 재적용 및 개선**: WasmBridge 클래스(`Dl`)의 `renderPageToCanvasFiltered`(print 프로파일 분기 포함), `getPageLayerTree`, `getPageFlowImageOps`, `getPageLayerTreeObject`, `getPageOverlayImages`, `getPageControlLayout` 및 CanvasKit 렌더러에 보정 로직 삽입. v0.9.0에서 새로 생긴 `clipPath` 노드도 CanvasKit 순회 대상에 추가.
     - **v6 변경점 (drawImage 인터셉터)**: v0.9.0 엔진은 회전된 서명 그림을 `setTransform`(90° 회전) 상태에서 가로·세로가 뒤바뀐 크기(65.9×95.6)로 `drawImage` 하므로, 인자 크기·좌표를 직접 비교하던 v5 판정이 빗나가 보정이 적용되지 않았음. v6는 현재 변환 행렬로 그리기 사각형의 네 꼭짓점을 화면 좌표로 변환해 bbox로 판정하고, 일치하면 변환 행렬에 화면 기준 평행이동만 더해 그림 (회전 포함 모든 변환 대응).
     - **검증 (`public/sample2.hwp` 6쪽)**: v0.9.0도 v0.8.7과 동일하게 서명 그림이 y=393.9(위 '건의사항' 칸)에 배치됨 → 업스트림 미수정 확인. v6 적용 후 Canvas2D에서 서명란 '(인)' 위치(y=511.25)로 이동함을 DPR 1·2에서 확인. 이 문서는 '한양견고딕' 글꼴 준비 실패로 CanvasKit 요청 시에도 Canvas2D로 폴백되므로 CanvasKit 경로는 이 문서로는 검증 불가.
  5. **업스트림 주요 변경**: PDF → HWP/HWPX 가져오기, 중첩 표·RowBreak·TAC 개체 흐름 보정, 표 칸 그림 삽입/이동, 글상자·머리말/꼬리말 저장 재열기 보존, 메모 API 등.
- **비고**: #4068(표 셀 부동 그림 4~6px 오차)은 v0.9.0에서 종료됐으나 별개 문제이며, 서명 그림이 위 칸으로 튀는 본 증상은 v0.9.0에서도 재현됨. 업스트림 후속 후보: #9036(서명란 겹침, v0.9.0 이후), #9022(결재 도장 행 높이, 진행 중).

---

### [PATCH-008] 업스트림 rhwp v0.9.1 동기화 및 첫 화면 로드 회귀 대응 (Upstream v0.9.1 Sync)
- **적용 일자**: 2026-11-24
- **영향 범위**: `package.json`, `public/rhwp_bg.wasm`, `public/studio/*`, `index.html`, `src/main.ts`, `src/styles/app.css`, `README*.md`, `src/i18n/locales.ts`
- **업스트림 릴리즈**: [edwardkim/rhwp v0.9.1](https://github.com/edwardkim/rhwp/releases/tag/v0.9.1) (태그 `981ce66b`, 호스팅 Studio 배포 커밋과 동일)
- **주요 동기화 내역**:
  1. **npm 패키지 업데이트**: `@rhwp/core@0.9.1`, `@rhwp/editor@0.9.1` 적용, 앱 버전 1.0.3.
  2. **WASM 코어 교체**: npm과 호스팅 Studio의 WASM이 동일(sha256 `e2e56dfd...`)하여 `public/rhwp_bg.wasm`과 `public/studio/*` 모두 같은 파일 사용.
  3. **Studio 독립 번들 갱신**: `assets/index-DJJqHHQc.js`, `index-D8P2zhVp.css`, `canvaskit-renderer-D32O9pl0.js`, `import-worker-ENBcDEGf.js` 등 교체. 절대 경로(`/rhwp/`) 치환 규칙은 PATCH-007과 동일하며, `import-worker`의 WASM 경로도 파일명 기준으로 치환.
  4. **글꼴 동기화**: 나눔·D2Coding·LatinModernMath 계열 11종이 v0.9.1 태그의 `assets/fonts`와 달라 공식본으로 교체 (기존본은 2026-09-29 최초 도입분).
  5. **[PATCH-001 v6] 재적용**: WasmBridge 클래스(`Ml`) 및 CanvasKit 렌더러에 동일 지점 삽입. v0.9.1의 `withHostPageFonts` 경로를 유지한 채 감쌈.
     - **보정값 캐시를 문서 단위로 한정**: 다른 문서를 먼저 연 뒤 서명 문서를 열면 쪽 번호만으로 저장된 이전 문서의 보정값이 재사용되어 보정이 빠지는 회귀를 확인(v0.9.0 번들에서는 같은 순서로 재현되지 않음). `_sigDoc`이 현재 문서와 다르면 캐시를 버리도록 수정.
- **앱 셸 회귀 대응**: v0.9.1은 첫 페이지가 실제로 그려지지 않으면 문서 열기를 실패로 처리(#9170). 시작 화면에서 `.editor-container`가 `display: none`이라 iframe 크기가 0이 되어 **모든 문서 열기가 실패**함.
  - `display: none` 대신 `position: absolute` + `visibility: hidden`으로 숨겨 iframe 크기를 유지.
  - 이로 인해 숨겨진 iframe이 포커스를 가져가 시작 화면 단축키(Cmd/Ctrl+O 등)가 동작하지 않으므로, 시작 화면인 동안 `window` blur 시 포커스를 되돌림 (`src/main.ts`).
- **검증**: `sample2.hwp` 6쪽에서 v0.9.1 엔진도 서명 그림을 y=393.9에 배치 → 업스트림 미수정 확인. 보정 후 y=511 (DPR 1·2, 다른 문서를 먼저 연 경우 포함). HWP로 내보낸 파일의 좌표는 393.9로 원본 유지. 내장 샘플 14종 열기, HWP/HWPX 내보내기를 외부 네트워크 차단 상태에서 확인. CanvasKit은 모듈·WASM 로딩까지만 확인.
- **알려진 한계 (v0.9.0과 동일)**: 서명이 있는 쪽을 편집해 표가 이동하면 보정값이 갱신되지 않아 서명이 표를 따라가지 못함.

---

### [PATCH-009] 데스크톱 앱 복사·붙여넣기 미동작 수정 (Clipboard)
- **적용 일자**: 2026-11-24
- **영향 범위**: `electron/main.ts`, `public/studio/index.html`
- **문제 원인**:
  1. **단축키**: macOS는 Cmd+X/C/V를 앱 메뉴의 role을 통해 `cut`/`copy`/`paste` 이벤트로 전달하는데, 커스텀 앱 메뉴에 편집 role이 하나도 없어 이벤트가 발생하지 않음.
  2. **편집 메뉴·우클릭 '붙이기'**: Studio가 사용하는 `document.execCommand('paste')`를 Electron이 기본 차단.
  3. **툴바 오려두기·복사하기·붙이기**: 업스트림 `index.html`의 세 버튼에 `data-cmd`가 없어 명령이 연결되지 않음.
- **조치 사항**:
  - 앱 메뉴에 '편집'(`cut`·`copy`·`paste` role) 추가.
  - `webPreferences.enableDeprecatedPaste: true` 적용.
  - 툴바 세 버튼에 `data-cmd="edit:cut|copy|paste"` 추가 (**Studio 번들 갱신 시 재적용 필요**).
- **비고**: 웹 브라우저에서는 보안 정책상 `execCommand('paste')`가 막혀 메뉴·툴바 '붙이기'는 동작하지 않으며 단축키(Ctrl/Cmd+V)를 사용해야 함.

---

### [PATCH-010] 저장 시 원본 덮어쓰기 및 새 문서 수정 (Save in place / New Document)
- **적용 일자**: 2026-11-24
- **영향 범위**: `public/studio/assets/index-*.js`(1줄), `src/services/electron-file-handle.ts`(신규), `src/services/editor-service.ts`, `src/services/file-service.ts`, `src/main.ts`, `src/types/electron.d.ts`, `electron/main.ts`, `electron/preload.ts`
- **문제 원인**:
  1. **저장**: Studio의 저장은 `currentFileHandle`이 있으면 같은 파일에 쓰고 없으면 위치를 묻는데, 앱이 문서를 열 때 경로를 넘기지 않았고 앱의 저장 메뉴도 항상 저장 대화상자를 띄움. HWPX를 열어도 HWP로만 저장함.
  2. **새 문서**: 존재하지 않는 명령 `file:new`를 호출함(Studio 명령은 `file:new-doc`).
- **조치 사항**:
  - 번들의 `var Y=new Ml;Nl(Y);var X=new Pl,aL=new XN(X);` 뒤에 `window.__rhwpHost={wasm:Y,events:X,confirmUnsaved:()=>MR()};`를 추가해 앱 셸이 현재 문서와 이벤트를 읽도록 함 (**Studio 번들 갱신 시 재적용 필요**).
  - 데스크톱에서 연 파일(열기·끌어 놓기) 경로를 파일 핸들로 감싸 `currentFileHandle`에 지정. 저장 메뉴·단축키·Studio 메뉴·저장 확인 대화상자가 모두 같은 파일에 원래 형식으로 덮어씀.
  - 경로가 없는 문서는 Electron 저장 대화상자로 한 번 묻고 이후 덮어씀. 쓰기에 실패하면 오류를 알리고 미저장 상태를 유지.
  - 새 문서는 `file:new-doc`을 호출하고, 미저장 변경이 있으면 Studio의 확인 대화상자(저장 / 저장 안 함 / 취소)를 사용. 문서가 실제로 바뀐 뒤(`document-swapped`) 앱의 파일명·쪽수를 갱신.
- **검증 (Electron 35, 저장 대화상자 호출 횟수와 디스크 파일 비교)**: HWP·HWPX 덮어쓰기, 새 문서의 저장/저장 안 함/취소, 새 문서 첫 저장과 재저장, 읽기 전용 파일, Studio가 자체로 연 문서가 이전 파일을 덮지 않음 등 19개 항목 통과. 내장 샘플 등 14개 문서를 저장 후 다시 열어 쪽수·본문 텍스트·개체 수 일치 확인.
- **비고**:
  - '내보내기' 메뉴는 형식을 골라 다른 파일로 저장하는 용도이므로 기존처럼 위치를 물음.
  - HML은 업스트림이 원본 보호를 위해 첫 저장에서 위치를 물음.

---

### [PATCH-011] 파일 열기·앱 종료 시 미저장 변경 확인 (Unsaved changes guard)
- **적용 일자**: 2026-11-24
- **영향 범위**: `src/services/editor-service.ts`, `src/main.ts`, `src/types/electron.d.ts`, `electron/main.ts`, `electron/preload.ts` (번들 연동은 PATCH-010의 `__rhwpHost.confirmUnsaved`)
- **문제 현상**: 저장하지 않은 문서가 있어도 앱에서 다른 파일을 열거나(열기·샘플·끌어 놓기) 앱을 종료하면 확인 없이 변경 내용이 사라짐.
- **조치 사항**:
  - 문서를 교체하거나 종료하기 전에 Studio의 확인 대화상자(저장 / 저장 안 함 / 취소)를 사용. '저장'은 PATCH-010에 따라 원본에 덮어씀. 저장 위치 선택을 취소하거나 저장에 실패하면 교체·종료하지 않음.
  - 창 닫기와 종료 메뉴는 `terminateApp()` 대신 `requestQuit()`을 거쳐 렌더러에 확인을 요청.
  - **PATCH-003 유지**: 렌더러가 준비 전이거나 비정상 종료됐으면 바로 종료하고, 3초 안에 응답하지 않으면 네이티브 대화상자로 강제 종료를 선택할 수 있음.
  - 열기를 취소하거나 실패하면 앱의 파일명·상태 표시가 바뀌지 않도록 수정.
- **검증 (Electron 35, 실제 메인 프로세스 코드)**: 열기·종료별 저장/저장 안 함/취소, 중복 요청, 저장 위치 취소, 편집기 무응답, 렌더러 비정상 종료 등 20개 항목 통과. 창을 닫은 뒤 프로세스가 종료 코드 0으로 끝나고 남지 않음을 확인.
- **비고**: '보기 > 새로고침·강제 새로고침'은 기존처럼 확인 없이 다시 불러옴(`will-prevent-unload`). 빌드 시 `npm run dist:release`는 두 아키텍처의 DMG를 동시에 만들며 같은 볼륨 이름으로 충돌할 수 있음. `electron-builder --mac dmg:arm64 zip:arm64`, `--mac dmg:x64 zip:x64`를 차례로 실행하면 됨.
