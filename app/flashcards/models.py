from sqlalchemy import Column,Integer,String,ForeignKey,DateTime
from app.database import Base
from datetime import datetime


class FlashCard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer,primary_key=True,autoincrement=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    doc_id = Column(String,nullable=True)
    topic  = Column(String)
    question = Column(String)
    answer = Column(String)
    created_at = Column(DateTime,default=datetime.utcnow)
    
    
    