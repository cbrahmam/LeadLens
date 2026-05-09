from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="LeadLens API")

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
