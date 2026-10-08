# RHWP STUDIO

<p align="center">
  <strong>RHWP STUDIO</strong> — 100% 로컬 독립 실행형 한글(HWP / HWPX / HML) 문서 뷰어 & 편집기 소프트웨어<br/>
  <em>Standalone Cross-platform HWP/HWPX Document Viewer & Editor powered by rhwp</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.1-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Electron%20(macOS%2C%20Windows)-brightgreen.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Engine-rhwp%20v0.8.7%20WASM-orange.svg" alt="Engine" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

<p align="center">
  <strong>한국어</strong> | <a href="README_EN.md">English</a>
</p>

---

## 🌟 개요 (Overview)

**RHWP STUDIO**는 한컴오피스나 별도 프로그램 설치 없이, 브라우저와 데스크톱에서 한글 문서(`.hwp`, `.hwpx`, `.hml`)를 열람(뷰어)하고 편집(에디터)할 수 있는 오픈소스 독립 소프트웨어입니다.

- **100% 로컬 독립 실행 (Offline First & Standalone)**: 외부 호스팅 URL(`edwardkim.github.io`)에 의존하지 않고, 자체 빌드된 로컬 번들(`public/studio`)을 탑재하여 인터넷 연결이 없는 폐쇄망이나 오프라인 환경에서도 완벽히 작동합니다.
- **포트 충돌 방지**: 기본 Vite 포트(5173)와의 충돌을 피하기 위해 **전용 고유 포트 `7788`**을 기본 포트로 채택했습니다.
- **듀얼 모드 지원 (뷰어 ↔ 에디터)**:
  - 👁️ **뷰어 모드**: 불필요한 편집 메뉴를 숨기고 깔끔한 화면에서 읽기 및 페이지 탐색에 집중할 수 있는 뷰어.
  - ✏️ **에디터 모드**: 한컴 스타일의 리본 메뉴, 도구 상자, 눈금자, 표 편집, 글자 모양, 문단 서식을 갖춘 완전한 문서 편집기.
- **웹 & 데스크톱 동시 지원**:
  - 웹 브라우저(`http://localhost:7788`)에서 가볍고 빠르게 실행.
  - Electron 기반 데스크톱 애플리케이션(macOS `.app`/`.dmg`, Windows `.exe`)으로 설치 및 네이티브 실행.
- **다국어 지원 (i18n)**: 한국어(KO) 및 영어(EN) 원클릭 즉시 전환 지원.

---

## 🚀 주요 기능 (Features)

### 1. 강력한 문서 호환성
- **HWP 5.0 Binary**: OLE2 Compound 바이너리 포맷 완벽 파싱 및 렌더링.
- **HWPX Open XML**: 한국산업표준(KS X 6101) 개방형 워드프로세서 마크업 언어 지원.
- **HML (HWPML 2.9/2.91)**: 구조적 XML 한글 문서 지원.

### 2. 열기, 편집, 저장 및 내보내기
- **파일 열기**: 탐색기 파일 선택 다이얼로그, 드래그 앤 드롭(Drag & Drop), 샘플 문서 원클릭 열기.
- **문서 저장**:
  - `HWP` 바이너리로 저장
  - `HWPX` 표준 XML로 저장
  - `HML` XML로 저장
- **내보내기 & 인쇄**:
  - `SVG` 벡터 페이지 이미지 내보내기
  - 브라우저 및 시스템 인쇄 다이얼로그 (`PDF 저장 / 프린터 출력`)

### 3. 직관적인 사용자 경험 (UX)
- 딥 슬레이트 다크 테마 기반의 모던 글래스모피즘 인터페이스.
- 페이지 넘김 (`이전 쪽`, `다음 쪽`, `현재 쪽 / 전체 쪽` 표시).
- 화면 배율 제어 (`확대`, `축소`, `쪽 맞춤`, `폭 맞춤`).
- 최근 열어본 문서 히스토리 관리.
- 실시간 토스트 알림 및 단축키 안내.

---

## ⌨️ 단축키 안내 (Keyboard Shortcuts)

| 단축키 (macOS / Windows) | 기능 설명 |
|--------------------------|-----------|
| `Cmd + O` / `Ctrl + O` | 문서 파일 열기 (`.hwp`, `.hwpx`, `.hml`) |
| `Cmd + S` / `Ctrl + S` | 현재 문서 HWP 파일로 저장 |
| `Cmd + N` / `Ctrl + N` | 새 빈 문서 작성 |
| `Cmd + M` / `Ctrl + M` | **뷰어 모드 ↔ 에디터 모드** 즉시 전환 |
| `Cmd + P` / `Ctrl + P` | 문서 인쇄 및 PDF 저장 |

---

## 📁 프로젝트 구조 (Project Structure)

```
rhwpsoft/
├── electron/                   # 데스크톱 애플리케이션 메인 프로세스
│   ├── main.ts                # 윈도우 생성, 네이티브 시스템 메뉴, IPC 핸들러
│   └── preload.ts             # 보안 IPC 브리지 (Window.electronAPI)
├── public/                     # 정적 에셋 및 로컬 번들
│   ├── studio/                # 100% 로컬 독립 실행용 rhwp-studio 빌드 번들
│   ├── rhwp_bg.wasm           # rhwp WebAssembly 코어 엔진 바이너리
│   └── sample.hwp             # 테스트용 내장 샘플 한글 문서
├── src/                        # 프론트엔드 UI 및 비즈니스 로직
│   ├── services/
│   │   ├── editor-service.ts  # 에디터/뷰어 엔진 래퍼 및 모드 전환 로직
│   │   ├── file-service.ts    # 파일 열기/저장/내보내기 (웹 & Electron 브리지)
│   │   ├── history-store.ts   # 최근 문서 기록 스토리지
│   │   └── toast-service.ts   # 토스트 팝업 알림 시스템
│   ├── styles/
│   │   └── app.css            # 프리미엄 다크 테마 및 컴포넌트 스타일
│   ├── types/
│   │   └── electron.d.ts      # Electron IPC 타입 정의
│   └── main.ts                # 메인 UI 이벤트 및 앱 진입점
├── index.html                  # 메인 HTML 셸
├── package.json                # 패키지 설정 및 빌드 스크립트
├── tsconfig.json               # TypeScript 컴파일러 설정
└── vite.config.ts              # Vite 번들러 설정
```

---

## 🛠️ 시작하기 (Getting Started)

### 요구 사양
- **Node.js**: v18.0.0 이상 (v20+ 권장)
- **npm**: v9.0.0 이상

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 웹 애플리케이션으로 실행 (개발 모드)
웹 브라우저에서 RHWP STUDIO를 즉시 실행합니다:
```bash
npm run dev
```
브라우저에서 `http://localhost:7788`으로 접속하면 바로 사용 가능합니다.

### 3. 데스크톱 앱으로 실행 (Electron 개발 모드)
독립 데스크톱 창으로 RHWP STUDIO를 실행합니다:
```bash
npm run electron:dev
```

### 4. 프로덕션 빌드

#### 웹 프로덕션 빌드:
```bash
npm run build
```
빌드 결과물은 `dist/` 폴더에 생성되며, 정적 웹 서버에 그대로 배포할 수 있습니다.

#### 데스크톱 설치 패키지 빌드 (OS별 인스톨러 생성):
결과물은 **`release/`** 배포 폴더에 자동으로 생성됩니다.

```bash
# macOS 전용 빌드 (.dmg, .pkg, .zip 생성)
npm run dist:mac

# Windows 전용 빌드 (.exe NSIS 설치 마법사 & portable 단일 실행 파일 생성)
npm run dist:win

# 전체 OS 동시 빌드 (macOS + Windows)
npm run dist:all
```

#### 생성되는 배포 설치 파일 목록 (`release/` 폴더):
| OS | 파일 형식 | 설명 |
|----|----------|------|
| **macOS** | `.dmg` | 드래그 앤 드롭 디스크 이미지 설치 파일 |
| **macOS** | `.pkg` | 시스템 관리자 및 자동 배포용 패키지 인스톨러 |
| **macOS** | `.zip` | 압축 해제 후 바로 실행 가능한 아카이브 |
| **Windows** | `.exe` (Setup) | 시작 메뉴 및 바탕화면 바로가기를 생성하는 NSIS 설치 마법사 |
| **Windows** | `.exe` (Portable) | 별도 설치 없이 바로 실행되는 무설치 포터블 실행 파일 |

---

## 🔏 미서명 설치 파일 자동 서명 & 보안 경고 해결

자체 서명(Self-Signed) 및 OS별 보안 경고를 원클릭으로 해결할 수 있는 스크립트를 제공합니다.

### 🍎 macOS ("확인되지 않은 개발자" 경고 해제)
macOS 격리 속성(Quarantine)을 원클릭으로 영구 해제합니다:
```bash
./scripts/fix-macos-quarantine.sh
```
또는 수동 실행:
```bash
xattr -cr "/Applications/RHWP STUDIO.app"
```

### 🪟 Windows (SmartScreen 경고 해제 및 인증서 자동 등록)
1. **자체 서명 인증서 생성**:
   ```bash
   ./scripts/create-self-signed-cert.sh
   ```
2. **Windows 시스템 루트 인증서 자동 등록**:
   - `scripts/install-cert-windows.bat` 파일을 마우스 우클릭 후 **[관리자 권한으로 실행]**하면 SmartScreen 경고 없이 신뢰된 소프트웨어로 자동 실행됩니다.

---

## 🖋️ 스마트 서명 / 직인(도장) 위치 자동 보정 패치

RHWP STUDIO는 한글 문서의 표/문단 아래 서명란(`(인)`, `(서명)`)에 배치된 이미지가 선행 박스로 위로 치솟는 오픈소스 조판 엔진 버그를 해결하기 위해 **스마트 서명 위치 자동 보정 패치([PATCH-001](PATCHES.md#patch-001-스마트-서명-및-직인-위치-자동-보정-smart-signature--stamp-alignment))**를 내장하고 있습니다.

- **100% 원본 바이너리 보존 (비파괴 패치)**: 원본 HWP 문서의 좌표 데이터를 왜곡하지 않고 화면 렌더링 단계에서 `(인)` 텍스트 앵커에 맞춰 시각적으로 자동 스냅(Snap)합니다. 따라서 에디터로 열람/편집 후 저장하거나 원본 한컴오피스에서 다시 열어도 서명 위치가 어긋나지 않습니다.
- **향후 업스트림 동기화**: 공식 `edwardkim/rhwp` 깃허브 저장소에서 조판 엔진 레벨의 근본 패치가 릴리즈되면 공식 WASM 엔진으로 매끄럽게 교체될 예정입니다.
- **자세한 패치 내역**: 전체 패치 이력과 기술 아키텍처 결정 사항은 📄 **[PATCHES.md](PATCHES.md)** 문서를 확인해 주세요.

---

## 🔒 보안 및 프라이버시 (Security & Privacy)

RHWP STUDIO는 모든 문서 파싱과 렌더링, 편집 작업을 **사용자의 기기 내부(브라우저/로컬 WASM 엔진)**에서 100% 수행합니다. 문서 데이터가 외부 서버나 클라우드로 일절 전송되지 않으므로, 대외비 또는 민감한 개인정보가 포함된 문서도 안심하고 열람하고 편집할 수 있습니다.

---

## 📜 라이선스 및 상표권 안내

- **엔진 라이선스**: [MIT License](LICENSE) (Based on [edwardkim/rhwp](https://github.com/edwardkim/rhwp))
- **상표권 고지**: "한글", "한컴", "HWP", "HWPX"는 주식회사 한글과컴퓨터의 등록 상표입니다. 본 프로젝트는 한글과컴퓨터와 제휴, 후원, 승인 관계가 없는 독립적인 오픈소스 소프트웨어입니다.
