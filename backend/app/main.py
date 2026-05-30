from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, reports, schedules, codes, stats, export, privacy
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(schedules.router)
app.include_router(codes.router)
app.include_router(stats.router)
app.include_router(export.router)
app.include_router(privacy.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
