# 배포 가이드 — Sketch 2 Render

## 아키텍처 요약

단일 컨테이너 구조. FastAPI가 React 빌드 결과물(`frontend/dist/`)을 StaticFiles로 서빙하므로 CORS 불필요.

```
GitHub main 브랜치 push
  → GitHub Actions (deploy.yml)
    → Docker 빌드 (멀티스테이지: Node.js 빌드 → Python 이미지)
      → Artifact Registry push
        → Cloud Run 배포 (asia-northeast3)
```

---

## 1. 로컬 개발

```bash
# 백엔드
cd backend
pip install -r requirements.txt
GEMINI_API_KEY=AIza... uvicorn backend.main:app --reload --port 8000

# 프론트엔드 (별도 터미널)
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
# → http://localhost:5173
```

---

## 2. 로컬 Docker 통합 테스트

프로덕션과 동일한 단일 컨테이너 환경으로 검증.

```bash
# 루트 디렉토리에서
cp .env.example .env
# .env 파일에 GEMINI_API_KEY=AIza... 입력

docker compose up --build
# → http://localhost:8080
```

---

## 3. 자동 배포 (권장)

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 → 배포.

```bash
git add .
git commit -m "변경사항 설명"
git push origin main
```

진행 상황: `https://github.com/<계정>/sketch-2-render/actions`

---

## 4. 수동 배포

로컬에 `gcloud` CLI가 설치된 경우 직접 Cloud Build 실행.

```bash
# 프로젝트 설정
gcloud config set project arch-diagnose

# 빌드 + 배포 (한 번에)
gcloud builds submit --config cloudbuild.yaml
```

빌드 로그: `https://console.cloud.google.com/cloud-build/builds?project=arch-diagnose`

---

## 5. GCP 최초 설정 (최초 1회)

새 환경에서 처음 배포할 때 필요한 설정.

### 5-1. 프로젝트 및 API 활성화

```bash
gcloud config set project arch-diagnose

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### 5-2. Artifact Registry 저장소 생성

```bash
gcloud artifacts repositories create sketch2render \
  --repository-format=docker \
  --location=asia-northeast3
```

### 5-3. Secret Manager에 Gemini API Key 등록

```bash
echo -n "AIza..." | gcloud secrets create GEMINI_API_KEY --data-file=-

# 이미 있으면 버전 추가
echo -n "AIza..." | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### 5-4. Cloud Run 서비스 계정에 Secret 접근 권한 부여

```bash
# 기본 Compute 서비스 계정 번호 확인
gcloud projects describe arch-diagnose --format="value(projectNumber)"
# → 예: 30350777436

gcloud projects add-iam-policy-binding arch-diagnose \
  --member="serviceAccount:30350777436-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5-5. GitHub Actions용 서비스 계정 생성

```bash
# 서비스 계정 생성
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding arch-diagnose \
  --member="serviceAccount:github-actions-deployer@arch-diagnose.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding arch-diagnose \
  --member="serviceAccount:github-actions-deployer@arch-diagnose.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding arch-diagnose \
  --member="serviceAccount:github-actions-deployer@arch-diagnose.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# JSON 키 발급
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions-deployer@arch-diagnose.iam.gserviceaccount.com
```

`key.json` 내용을 GitHub → Settings → Secrets → Actions → `GCP_SA_KEY`에 붙여넣기.  
**발급 후 key.json은 즉시 삭제** (`.gitignore`에 등록되어 있으나 커밋 주의).

```bash
del key.json   # Windows
```

---

## 6. 환경변수 정리

| 위치 | 변수명 | 설명 |
|---|---|---|
| GCP Secret Manager | `GEMINI_API_KEY` | Gemini API 인증키 |
| GitHub Secrets | `GCP_SA_KEY` | 서비스 계정 JSON 전체 내용 |
| `frontend/.env.local` | `VITE_API_URL` | 로컬 개발 시 `http://localhost:8000` |

프로덕션에서 `VITE_API_URL`은 빈 문자열(same-origin)이므로 설정 불필요.

---

## 7. 배포 확인

```bash
# Cloud Run 서비스 URL 확인
gcloud run services describe sketch2render-app \
  --region=asia-northeast3 \
  --format="value(status.url)"

# 헬스체크
curl https://<서비스-URL>/health
# → {"status":"ok"}
```

---

## 8. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| GitHub Actions 인증 실패 | `GCP_SA_KEY` 시크릿이 비어있거나 잘못된 JSON | 서비스 계정 키 재발급 후 시크릿 재등록 |
| Secret Manager 권한 거부 | Compute 서비스 계정에 `secretAccessor` 미부여 | 5-4 단계 실행 |
| `npm ci` 실패 | `frontend/package-lock.json` 미커밋 | `cd frontend && npm install` 후 커밋 |
| 컨테이너 빌드 실패 | Docker 멀티스테이지 빌드 오류 | `docker compose up --build`로 로컬 재현 후 디버깅 |
| 빌드는 되는데 API 오류 | Gemini API Key 만료 또는 잘못된 키 | Secret Manager에서 키 버전 업데이트 |
