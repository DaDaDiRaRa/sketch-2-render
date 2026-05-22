import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import inpaint, prompt, render, upscale

app = FastAPI(title="Sketch 2 Render API", version="1.0.0")

# CORS — only needed for local dev (single container = same origin in production)
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(render.router,  prefix="/api", tags=["render"])
app.include_router(inpaint.router, prefix="/api", tags=["inpaint"])
app.include_router(upscale.router, prefix="/api", tags=["upscale"])
app.include_router(prompt.router,  prefix="/api", tags=["prompt"])


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve React build output (only present in the production Docker image)
_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        return FileResponse(_DIST / "index.html")
