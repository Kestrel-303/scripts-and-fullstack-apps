import os
import sys
from contextlib import asynccontextmanager

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.database import engine, Base
    from backend.app.routers import auth, parent, teacher, admin, student
except ImportError:
    from app.database import engine, Base
    from app.routers import auth, parent, teacher, admin, student

# Lifespan context manager for database table creation on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run table creation on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="School Management System API",
    description="Parent & Student Portal Backend API with Role-Based Access Control",
    version="1.0.0",
    lifespan=lifespan
)

# Parse allowed origins from environment variable with local fallback
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    origin.strip() for origin in frontend_url.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(parent.router)
app.include_router(teacher.router)
app.include_router(admin.router)
app.include_router(student.router)


@app.get("/")
def read_root():
    return {
        "app": "School Management System API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": "connected"}