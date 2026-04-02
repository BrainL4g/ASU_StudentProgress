"""
ASU Student Progress API — основной модуль приложения.

Инициализирует FastAPI, подключает CORS, маршруты и seed-данные.
"""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .routers import auth as auth_routes
from .routers import admin as admin_routes
from .routers import teacher as teacher_routes
from .routers import student as student_routes
from .seed import seed_database

app = FastAPI(title="ASU Student Progress API")

# ─── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Маршруты ───────────────────────────────────────────────────────────────
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(teacher_routes.router)
app.include_router(student_routes.router)


# ─── Startup ────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    """Создаёт таблицы БД и запускает seed-данные при старте приложения."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
