# Summary — Sketch 2 Render

---

## 앱 개요

**Sketch 2 Render**는 건축 외관 스케치(화이트 모델·CAD·도면 이미지)를 Google Gemini AI로 실사 렌더링 이미지로 변환해주는 웹 앱이다.

- **주요 사용자**: 건축 설계자, 건축학과 학생, 공모전 제출용 렌더링이 필요한 실무자
- **사용 맥락**: 원본 모델 이미지를 업로드하고 스타일 레퍼런스·환경 이미지를 선택적으로 추가해 렌더링을 생성. 생성 후 인페인팅(부분 수정)·업스케일 후처리 가능.
- **접근 제한**: 비밀번호 입력 화면 존재 (세션 인증, App.tsx 내 하드코딩)

---

## 기술 스택

### 백엔드
| 항목 | 내용 |
|---|---|
| 언어 | Python 3.12 |
| 웹 프레임워크 | FastAPI 0.115+ |
| 서버 | Uvicorn (ASGI) |
| AI SDK | `google-genai` 1.0+ (Google Gemini 공식 Python SDK) |
| 이미지 처리 | Pillow 10+ (패딩, 라인아트 추출, 뎁스맵 추출) |
| 유효성 검사 | Pydantic v2 |
| 환경변수 | python-dotenv |

### 프론트엔드
| 항목 | 내용 |
|---|---|
| 언어 | TypeScript 5.8 (strict mode, noUnusedLocals/Parameters) |
| UI 프레임워크 | React 19 |
| 빌드 도구 | Vite 6 |
| CSS | Tailwind CSS v4 (`@import "tailwindcss"` 방식) |
| 애니메이션 | Motion (motion/react) 12 |
| 파일 업로드 | react-dropzone 15 |
| 아이콘 | lucide-react 0.546 |
| 디자인 토큰 | `kunwon-tokens.css` (건원건축 CSS 변수 시스템) |
| 폰트 | Pretendard (CDN) |

### 인프라
| 항목 | 내용 |
|---|---|
| 컨테이너 | Docker 단일 컨테이너 (멀티스테이지 빌드) |
| 배포 플랫폼 | Google Cloud Run (asia-northeast3, 서울) |
| CI/CD | GitHub Actions (`main` 푸시 시 자동 빌드·배포) |
| 이미지 저장소 | Google Artifact Registry |
| 시크릿 관리 | GCP Secret Manager (`GEMINI_API_KEY`) |
| 수동 배포 | GCP Cloud Build (`cloudbuild.yaml`) |

### 외부 API
- **Google Gemini API** 2종 모델
  - `gemini-2.0-flash-preview-image-generation` — 이미지 생성·인페인팅·업스케일
  - `gemini-2.5-flash` — 텍스트 프롬프트 개선

---

## 핵심 기능 목록

### 1. 렌더링 생성
- 원본 이미지를 입력받아 비율에 맞게 패딩 → 라인아트·뎁스맵 추출 → 5-NODE 시스템 프롬프트와 함께 Gemini에 전송해 렌더링 이미지 반환
- 처리 파일: `backend/services/gemini.py` (`generate_render`) → `backend/routes/render.py` → `frontend/src/api/render.ts` → `frontend/src/App.tsx` (`handleGenerateRendering`)
- 입력: ControlNet 이미지(필수), IPAdapter 스타일 레퍼런스(선택), Florence 환경 이미지(선택), 긍정/부정 프롬프트, 시드, 온도

### 2. 이미지 입력 노드 (3종)
- **원본 이미지 (ControlNet)**: 건물 구조·카메라 앵글의 기준. 필수 입력.
- **스타일 레퍼런스 (IPAdapter)**: 재질·색감·조명을 추출해 적용. 선택.
- **환경 이미지 (Florence)**: 배경·날씨·조경 정보를 추출. 선택.
- 처리 파일: `frontend/src/components/ImageUploadNodes.tsx` (드래그앤드롭, 미리보기, Strength 슬라이더 UI)

### 3. 이미지 전처리 (서버사이드)
- `_closest_aspect_ratio()`: 입력 이미지의 가로세로 비를 5가지 표준 비율 중 가장 가까운 것으로 매핑
- `_pad_image()`: 흰색 패딩으로 캔버스 비율 맞춤
- `_extract_lineart()`: 그레이스케일 + 임계값 이진화 (150 기준) → CAD 경계선 추출
- `_extract_depth()`: 그레이스케일 + 가우시안 블러(radius=2) → 뎁스맵 추사
- 처리 파일: `backend/services/gemini.py`

### 4. 스타일 프리셋
- 4가지 하드코딩된 프리셋: Sunny Day, Night Cinematic, Eye-Level, Birds-Eye
- 선택 시 긍정/부정 프롬프트 자동 입력, 이전 AI 개선 내용 초기화
- 처리 파일: `frontend/src/components/PromptPanel.tsx` (`STYLE_PRESETS` 상수)

### 5. AI 프롬프트 개선
- 긍정 프롬프트: 건축 사진가·프롬프트 엔지니어 페르소나로 영문 전문 프롬프트로 변환
- 부정 프롬프트: 건축 품질 검사관 페르소나로 기술적 렌더링 결함 목록으로 확장
- Original/Improved 토글 버튼으로 전후 비교 가능
- 처리 파일: `backend/services/gemini.py` (`improve_positive_prompt`, `improve_negative_prompt`) → `backend/routes/prompt.py` → `frontend/src/api/prompt.ts` → `frontend/src/components/PromptPanel.tsx`

### 6. 렌더링 미리보기 (비교 슬라이더)
- 원본 이미지(그레이스케일 50% 투명)와 렌더링 결과를 나란히 표시
- `clipPath: inset(0 ${100-value}% 0 0)` CSS로 슬라이더 구현
- `<input type="range">` 투명 오버레이로 드래그 인터랙션 처리
- 처리 파일: `frontend/src/components/PreviewCanvas.tsx`

### 7. 인페인팅 (Focus Edit)
- 렌더링 결과 위에 Canvas로 마스크 직접 드로잉
- 브러시 크기 조절 (5~150px), 3가지 브러시 색상 (시각적 구분용)
- 마스크 + 원본 이미지 + 텍스트 지시를 Gemini에 전송해 마스크 영역만 수정
- Undo 히스토리 스택으로 이전 상태 복구 가능
- 처리 파일: `backend/services/gemini.py` (`inpaint`) → `backend/routes/inpaint.py` → `frontend/src/api/inpaint.ts` → `frontend/src/components/PreviewCanvas.tsx`

### 8. 업스케일
- 1K / 2K / 4K 3가지 해상도 옵션
- Gemini에 "enhance and upscale to {resolution}" 프롬프트로 처리
- Undo 히스토리에 포함
- 처리 파일: `backend/services/gemini.py` (`upscale`) → `backend/routes/upscale.py` → `frontend/src/api/upscale.ts` → `frontend/src/components/PreviewCanvas.tsx`

### 9. 시드 제어
- Random 모드: 매 생성마다 `random.randint(0, 2_147_483_647)` 로 랜덤 시드 생성 (백엔드에서 처리)
- Fixed 모드: 사용자가 입력한 시드 값 고정 사용 (동일 구도 재현)
- 처리 파일: `backend/routes/render.py`, `frontend/src/components/SettingsPanel.tsx`

### 10. 이미지 다운로드
- 결과 이미지를 `architectural-rendering.png` 파일명으로 브라우저 다운로드
- 처리 파일: `frontend/src/components/PreviewCanvas.tsx` (`handleDownload`)

---

## 파일 구조

```
sketch-2-render/
│
├── backend/
│   ├── __init__.py
│   ├── main.py                  # FastAPI 앱 초기화, CORS, 라우터 등록, StaticFiles + SPA fallback
│   ├── requirements.txt         # Python 의존성
│   ├── Dockerfile               # ⚠️ 잔여 파일 (구 2컨테이너 방식). 현재 미사용.
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── render.py            # POST /api/render — 렌더링 요청 처리, seed 분기
│   │   ├── inpaint.py           # POST /api/inpaint — 인페인팅 요청 처리
│   │   ├── upscale.py           # POST /api/upscale — 업스케일 요청 처리
│   │   └── prompt.py            # POST /api/prompt/improve-{positive,negative}
│   └── services/
│       ├── __init__.py
│       └── gemini.py            # 모든 Gemini API 호출 집중. 이미지 전처리 포함.
│
├── frontend/
│   ├── index.html               # Vite 앱 진입 HTML
│   ├── package.json             # 프론트엔드 의존성 (React 19, Tailwind v4, Motion 등)
│   ├── package-lock.json
│   ├── tsconfig.json            # 엄격 타입 설정 (noUnusedLocals, noUnusedParameters)
│   ├── vite.config.ts           # Vite 설정 (@tailwindcss/vite 플러그인)
│   ├── Dockerfile               # ⚠️ 잔여 파일 (구 nginx 방식). 현재 미사용.
│   ├── nginx.conf               # ⚠️ 잔여 파일 (구 nginx 방식). 현재 미사용.
│   ├── .env.example             # VITE_API_URL 예시
│   └── src/
│       ├── main.tsx             # React 앱 마운트
│       ├── App.tsx              # 루트 컴포넌트. 전역 state, 비밀번호 인증, 레이아웃
│       ├── index.css            # Pretendard 폰트, 토큰 import, Tailwind import, body 기본값
│       ├── kunwon-tokens.css    # 건원건축 디자인 토큰 (색상, 폰트, 간격, 그림자 CSS 변수)
│       ├── vite-env.d.ts        # import.meta.env 타입 선언
│       ├── types/
│       │   └── index.ts         # ImageFile 인터페이스 (file, preview, base64, width, height)
│       ├── api/
│       │   ├── client.ts        # fetch 래퍼 (BASE_URL = VITE_API_URL ?? '' (same-origin))
│       │   ├── render.ts        # generateRendering() — POST /api/render
│       │   ├── inpaint.ts       # applyInpaintingApi() — POST /api/inpaint
│       │   ├── upscale.ts       # upscaleImageApi() — POST /api/upscale
│       │   └── prompt.ts        # improvePositivePrompt(), improveNegativePrompt()
│       └── components/
│           ├── App.tsx          # ← 루트는 src/App.tsx
│           ├── ImageUploadNodes.tsx  # 3종 이미지 업로드 카드 (드래그앤드롭, Strength 슬라이더)
│           ├── SettingsPanel.tsx     # Imagination Level(temperature) + Seed Control 설정 패널
│           ├── PromptPanel.tsx       # 스타일 프리셋 + 긍정/부정 프롬프트 + AI 개선 버튼
│           ├── PreviewCanvas.tsx     # 결과 이미지 뷰어, 비교 슬라이더, 인페인팅 편집 모드, 업스케일
│           └── Tooltip.tsx           # 호버 툴팁 (Motion 애니메이션)
│
├── Dockerfile                   # ✅ 현재 사용. 멀티스테이지 (Node 20-alpine → Python 3.12-slim)
├── docker-compose.yml           # 로컬 통합 테스트 (단일 컨테이너, port 8080)
├── cloudbuild.yaml              # GCP Cloud Build 수동 배포 설정
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions CI/CD (main 푸시 → 자동 배포)
├── .env.example                 # GEMINI_API_KEY, VITE_GEMINI_API_KEY 예시
├── .gitignore
├── .dockerignore
├── CLAUDE.md                    # Claude Code용 프로젝트 가이드
└── README.md

⚠️ 루트의 src/, index.html, package.json, vite.config.ts, tsconfig.json
   → 구조 개편 전 잔여 파일. 현재 앱과 무관. 삭제 권장.
```

---

## 데이터 흐름

### 렌더링 생성

```
[사용자]
  ↓ 이미지 파일 업로드 (드래그앤드롭)
[ImageUploadNodes.tsx]
  → FileReader로 base64 변환
  → Image 객체로 width/height 측정
  → ImageFile 상태에 저장
  ↓
[App.tsx — handleGenerateRendering()]
  → controlNetImg (필수), ipAdapterImg, florenceImg 수집
  → generateRendering() 호출 (api/render.ts)
  ↓
[api/client.ts — apiPost()]
  → fetch POST /api/render (JSON body: base64 + 설정값)
  ↓
[backend/routes/render.py]
  → seed_mode에 따라 seed 결정 (random or fixed)
  → gemini.generate_render() 호출
  ↓
[backend/services/gemini.py — generate_render()]
  1. base64 디코드 → raw bytes
  2. _closest_aspect_ratio(): 이미지 비율 → "1:1" / "4:3" / "3:4" / "16:9" / "9:16"
  3. _pad_image(): 해당 비율로 흰색 패딩 추가
  4. _extract_lineart(): 이진화 라인아트 추출
  5. _extract_depth(): 가우시안 블러 뎁스맵 추출
  6. Parts 조립:
     - 시스템 지시문 (NODE 기반 프로토콜)
     - NODE 1: 패딩된 원본 이미지
     - NODE 2: 라인아트
     - NODE 3: 뎁스맵
     - NODE 4: IPAdapter 이미지 (선택)
     - NODE 5: Florence 이미지 (선택)
     - 사용자 프롬프트 (긍정/부정)
  7. Gemini IMAGE_MODEL 호출 (seed, temperature 설정)
  8. 응답에서 inline_data 추출 → (base64, mime_type) 반환
  ↓
[HTTP 응답 { image_base64, mime_type }]
  ↓
[App.tsx]
  → data:{mime_type};base64,{image_base64} 형태로 resultImage 상태 저장
  ↓
[PreviewCanvas.tsx]
  → 원본(그레이스케일)과 렌더링 결과를 비교 슬라이더로 표시
```

### 인페인팅

```
[PreviewCanvas.tsx — Focus Edit 모드]
  → Canvas에 브러시로 마스크 드로잉
  → "Generate Edit" 버튼 클릭
  ↓
[applyInpainting()]
  → canvas.toDataURL('image/png') → 마스크 base64
  → resultImage.split(',')[1] → 이미지 base64
  → applyInpaintingApi() 호출 (api/inpaint.ts)
  ↓
[POST /api/inpaint → gemini.inpaint()]
  → 원본 이미지 + 마스크 이미지 + 텍스트 지시를 Gemini에 전송
  → 마스크 영역만 수정된 이미지 반환
  ↓
[PreviewCanvas.tsx]
  → 이전 resultImage를 history 스택에 push
  → 새 이미지로 resultImage 업데이트
  → 편집 모드 종료, 마스크 초기화
```

### 업스케일

```
[PreviewCanvas.tsx]
  → "1K" / "2K" / "4K" 버튼 클릭
  → upscaleImageApi(imageBase64, resolution) 호출
  ↓
[POST /api/upscale → gemini.upscale()]
  → 이미지 + 해상도 텍스트를 Gemini에 전송
  → 처리된 이미지 반환
  ↓
[PreviewCanvas.tsx]
  → history 스택에 push → 새 이미지로 업데이트
```

### 프롬프트 AI 개선

```
[PromptPanel.tsx — "Improve" 버튼 클릭]
  → 현재 프롬프트를 originalPrompt에 저장
  → improvePositivePrompt(prompt) 또는 improveNegativePrompt(prompt) 호출
  ↓
[POST /api/prompt/improve-{positive,negative} → gemini.improve_*_prompt()]
  → Gemini TEXT_MODEL로 텍스트 변환
  → 개선된 프롬프트 문자열 반환
  ↓
[PromptPanel.tsx]
  → 프롬프트 상태 업데이트
  → Original/Improved 토글 버튼 표시
```

---

## 현재 한계 / 미완성 부분

### 기능 미연결
- **IPAdapter Strength / Florence Strength 슬라이더가 실제로 동작하지 않는다.**  
  `App.tsx`에서 `ipAdapterStrength`, `florenceStrength` 상태를 관리하고 `ImageUploadNodes.tsx`에서 UI도 표시하지만, `generateRendering()` 호출 시 이 값들이 전달되지 않는다. `api/render.ts`의 `RenderRequest` 타입에도, `backend/routes/render.py`의 Pydantic 모델에도, `backend/services/gemini.py`의 `generate_render()` 함수 파라미터에도 해당 필드가 없다. Gemini API가 이미지 혼합 강도를 직접 지원하지 않아서 현재는 프롬프트 텍스트로만 제어한다.

### 보안
- **비밀번호가 `App.tsx`에 하드코딩** (`'0908'`). 환경변수나 백엔드 인증 없음.
- **API 엔드포인트에 인증이 없다.** Cloud Run URL을 아는 사람이라면 누구나 직접 API를 호출할 수 있다.
- **요청 횟수 제한(Rate limiting) 없음.** Gemini API 비용이 무제한 소비될 수 있다.

### 업스케일 품질
- `gemini.upscale()`은 Gemini에 "enhance and upscale to {resolution}" 텍스트를 보내는 방식으로, Gemini가 실제로 픽셀 해상도를 정확히 조정해준다는 보장이 없다. 전통적인 업스케일러(ESRGAN 등)와 달리 결과가 불확정적이다.

### 인페인팅 시드
- `backend/services/gemini.py`의 `inpaint()` 함수에서 시드가 `42`로 하드코딩되어 있다. 매번 동일한 시드로 고정되어 다양한 결과 생성이 어렵다.

### 잔여 파일 (삭제 권장)
- **루트 `src/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`**: 단일 컨테이너로 구조 개편 전의 원본 프론트엔드 코드. 현재 앱과 무관하지만 저장소에 남아 혼란을 준다.
- **`frontend/Dockerfile`, `frontend/nginx.conf`**: 구 2컨테이너 아키텍처 잔여물. 현재 루트 `Dockerfile`로 대체됨.
- **`backend/Dockerfile`**: 현재는 루트 `Dockerfile`에서 처리되므로 미사용.

### 미구현 기능 (UI에 흔적 있음)
- `PromptPanel.tsx`에서 `handleImprovePrompt`, `handleImproveNegativePrompt` 등을 props로 외부에서 주입받는 구조이지만, `App.tsx`는 이 props를 전달하지 않는다. 내부 fallback 로직으로 동작하긴 하나, 외부 제어가 필요한 경우를 위해 만들어진 인터페이스가 실제로는 사용되지 않는다.
- `PreviewCanvas.tsx`도 동일한 패턴 — 대부분의 핸들러가 props 또는 내부 state 중 하나를 선택하는 이중 구조이지만 외부에서 제어되지 않는다.
