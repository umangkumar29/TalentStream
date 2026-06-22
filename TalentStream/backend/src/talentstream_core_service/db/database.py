from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from talentstream_core_service.configs.config import settings

# ── Local DB Support ──────────────────────────────────────────────────────────
# If DATABASE_URL starts with "sqlite", we create a local file.
# Otherwise we use the provided postgres URL.
# Typical local file: sqlite:///./talentstream.db
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
connect_args = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
