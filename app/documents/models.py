from sqlalchemy import Column,Integer,String,DateTime,ForeignKey
from app.database import Base
from datetime import datetime

class Document(Base):
    __tablename__ = "user_documents"
    id = Column(Integer,primary_key=True,autoincrement=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    filename =  Column(String)
    doc_id = Column(String,unique=True)
    created_at = Column(DateTime,default=datetime.utcnow)