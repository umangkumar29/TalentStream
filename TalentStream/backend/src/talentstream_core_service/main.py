from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from talentstream_core_service.api.v1.endpoints import candidates, jobs, auth, analytics, projects
from talentstream_core_service.db.database import engine, Base
from talentstream_core_service.configs.config import settings
from talentstream_core_service.observability.logger import logger

# ── Database Boot ─────────────────────────────────────────────────────────────
# We are now using Alembic for migrations, so we don't need create_all anymore.

# ── App Initialization ────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── Middleware: Performance & Logging ─────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Structured log for every incoming request
    logger.info("request_finished", extra={
        "method": request.method,
        "path": request.url.path,
        "process_time_ms": int(process_time * 1000),
        "status_code": response.status_code
    })
    
    return response

# ── CORS: Restricted for Production ───────────────────────────────────────────
import os
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [
    "http://localhost:5173",  # Vite local dev
    "http://localhost:3000",  # Common fallback
]
if allowed_origins_env:
    origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(candidates.router, prefix="/api/v1", tags=["Candidates"])
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(projects.router, prefix="/api/v1", tags=["Projects"])

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "TalentStream-AI-Backend", "time": time.time()}

# ── Global Error Handlers ─────────────────────────────────────────────────────
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_error", extra={
        "path": request.url.path,
        "error": str(exc),
        "type": type(exc).__name__
    })
    return JSONResponse(status_code=500, content={"detail": "An internal server error occurred."})
