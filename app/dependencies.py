from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.models import User
from app.auth import service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def current_user(
    token:str = Depends(oauth2_scheme),
    db:Session = Depends(get_db)
)->User:
    user_id = service.decode_access_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401,detail="User not found")
    return user
