import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Previously hard-coded to 127.0.0.1:5436, which matches neither the
# docker-compose port (5435) nor the in-network address (db:5432).
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://local:local@127.0.0.1:5435/classroom"
)
# psycopg2 does not understand Prisma's ?schema= query parameter.
DATABASE_URL = DATABASE_URL.split("?schema=")[0]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # survive database restarts / idle disconnects
    pool_size=int(os.getenv("DATABASE_POOL_SIZE", "5")),
    max_overflow=5,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
