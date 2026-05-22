# CLAUDE.md — Sketch 2 Render

건축 외관 스케치를 AI 렌더링 이미지로 변환하는 도구.
Google Gemini API를 백엔드에서 호출하고, React 프론트엔드가 결과를 표시한다.

---

## 프로젝트 구조

```
sketch-2-render/
├── backend/                  # FastAPI 백엔드 (Python 3.12)
│   ├── main.py               # 앱 진입점, CORS, StaticFiles 마운트
│   ├── routes/               # API 라우터 (render, inpaint, upscale, prompt)
│   ├── services/gemini.py    # 모든 Gemini API 호출 집중
│   └── requirements.txt
├── frontend/                 # React 프론트엔드 (Vite + TypeScript)
│   └── src/
│       ├── api/              # 백엔드 호출 레이어 (client.ts + 4개 모듈)
│       ├── components/       # UI 컴포넌트
│       ├── types/index.ts    # 공유 타입 (ImageFile)
│       ├── kunwon-tokens.css # 디자인 토큰 (건원건축 CI)
│       └── index.css         # Tailwind + 토큰 import
├── Dockerfile                # 단일 컨테이너 멀티스테이지 빌드
├── docker-compose.yml        # 로컬 통합 테스트
└── cloudbuild.yaml           # GCP Cloud Build 수동 배포
```

루트의 `src/`, `index.html`, `package.json`, `vite.config.ts` 등은 구조 개편 전 잔여 파일이므로 무시한다.

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Python 3.12, FastAPI, Uvicorn |
| AI | Google Gemini (`google-genai` SDK) |
| 이미지 처리 | Pillow (서버사이드) |
| 프론트엔드 | React 19, Vite 6, TypeScript, Tailwind CSS v4 |
| 배포 | Google Cloud Run (asia-northeast3), 단일 컨테이너 |
| CI/CD | GitHub Actions (main 푸시 시 자동 배포) |

---

## Gemini 모델 상수

`backend/services/gemini.py`에 정의. 절대 하드코딩 금지.

```python
IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation"
TEXT_MODEL  = "gemini-2.5-flash"
```

---

## API 엔드포인트

모든 라우트는 `/api` 접두사를 가진다.

| 메서드 | 경로 | 기능 |
|---|---|---|
| POST | `/api/render` | 스케치 → 렌더링 이미지 생성 |
| POST | `/api/inpaint` | 마스크 영역 인페인팅 |
| POST | `/api/upscale` | 이미지 해상도 업스케일 |
| POST | `/api/prompt/improve-positive` | 프롬프트 개선 (긍정) |
| POST | `/api/prompt/improve-negative` | 프롬프트 개선 (부정) |
| GET  | `/health` | 헬스체크 |

---

## 단일 컨테이너 아키텍처

- `Dockerfile`: Node.js로 프론트엔드 빌드 → Python 이미지에 `frontend/dist/` 복사
- `backend/main.py`가 `/assets` StaticFiles + SPA fallback (`/{full_path}` → `index.html`)으로 React 앱 서빙
- `_DIST.is_dir()` 조건으로 로컬 개발 환경(dist 없음)과 프로덕션 구분
- 프로덕션에서는 CORS 불필요 (same-origin). 로컬 개발 시 `ALLOWED_ORIGINS` 환경변수로 제어

---

## 로컬 개발

```bash
# 백엔드만
cd backend
pip install -r requirements.txt
GEMINI_API_KEY=... uvicorn backend.main:app --reload --port 8000

# 프론트엔드만
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm install && npm run dev

# Docker 통합 테스트
cp .env.example .env   # GEMINI_API_KEY 입력
docker compose up --build
# → http://localhost:8080
```

---

## 배포

**GCP 정보**
- Project ID: `arch-diagnose`
- Region: `asia-northeast3` (서울)
- Service: `sketch2render-app`
- Image: `asia-northeast3-docker.pkg.dev/arch-diagnose/sketch2render/app`

**자동 배포** — `main` 브랜치 푸시 시 GitHub Actions 트리거  
GitHub Secret `GCP_SA_KEY` 필요 (서비스 계정 JSON).

**수동 배포**
```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 디자인 시스템

`frontend/src/kunwon-tokens.css`에 CSS 변수로 정의된 건원건축 디자인 토큰을 사용한다.

**규칙: 색상·폰트·간격 하드코딩 금지. 반드시 CSS 변수 사용.**

```css
/* ❌ 금지 */
color: #e60012;
font-family: 'Pretendard', sans-serif;

/* ✅ 사용 */
color: var(--color-accent);
font-family: var(--font-primary);
```

Tailwind v4에서 CSS 변수 사용법:
```tsx
// 클래스에서
className="bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"

// hover 상태
className="hover:[background:var(--color-accent-hover)]"

// box-shadow, font-family는 inline style
style={{ boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-primary)' }}
```

---

## TypeScript 엄격 설정

`frontend/tsconfig.json`에 `noUnusedLocals`, `noUnusedParameters` 활성화.  
사용하지 않는 변수가 있으면 빌드 실패. 주의할 것.

---

## 환경변수

| 변수 | 위치 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | 백엔드, GCP Secret Manager | Gemini API 인증키 |
| `ALLOWED_ORIGINS` | 백엔드 | CORS 허용 출처 (로컬 개발용) |
| `VITE_API_URL` | 프론트엔드 빌드 | API 베이스 URL (프로덕션은 빈 문자열 = same-origin) |

`.env` 파일은 절대 커밋 금지. `key.json`도 절대 커밋 금지 (`.gitignore`에 등록됨).
