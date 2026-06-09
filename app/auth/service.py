from passlib.context import CryptContext
from jose import jwt,JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException
from dotenv import load_dotenv
import os


load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


pwd_context = CryptContext(schemes=["bcrypt"],deprecated= "auto")

def hash_password(plain:str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain:str,hashed:str)->bool:
    return pwd_context.verify(plain,hashed)

def create_access_token(user_id:str)->str:
    payload = {
        "sub" : str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=30) #key being valid for the first 30 min after creation
    }
    token = jwt.encode(payload,SECRET_KEY,algorithm=ALGORITHM)
    return token

def decode_access_token(token: str) -> int:     
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        return user_id
    except JWTError:
        raise HTTPException(401,"Could not validate credentials")
    
    
