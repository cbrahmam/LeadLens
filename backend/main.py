import shutil
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BACKEND_DIR = Path(__file__).resolve().parent
CACHE_DIR = BACKEND_DIR / "cache"
SAMPLE_DIR = BACKEND_DIR / "sample_data"


def seed_sample_data() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if not SAMPLE_DIR.exists():
        return
    for sample_file in SAMPLE_DIR.glob("*_research.json"):
        cache_file = CACHE_DIR / sample_file.name
        if not cache_file.exists():
            shutil.copy2(sample_file, cache_file)


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_sample_data()
    yield


app = FastAPI(title="LeadLens API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers import research  # noqa: E402

app.include_router(research.router, prefix="/api")


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "LeadLens API"}
