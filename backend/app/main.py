import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.database import SessionLocal
from app.routers import auth, reports, schedules, codes, stats, export, privacy
from app.routers import notifications, containers
from app.jobs.cleanup_job import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Gestión de Basuras API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)
app.include_router(containers.router, prefix=PREFIX)
app.include_router(schedules.router, prefix=PREFIX)
app.include_router(codes.router, prefix=PREFIX)
app.include_router(stats.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(privacy.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)

os.makedirs("static/photos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health", tags=["health"])
def health():
    db_status = "unavailable"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        pass
    return {"status": "ok" if db_status == "connected" else "error", "db": db_status}
