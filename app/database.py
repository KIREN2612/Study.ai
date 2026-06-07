from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase,Session,sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
#start the database engine
engine = create_engine(DATABASE_URL)
#sessionlocal is a manual which we can use to create sessions.
SessionLocal = sessionmaker(bind = engine,autocommit = False,autoflush=False)


class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db  # pause here, hand the session to the route, resume after route finishes
    finally:
        db.close()