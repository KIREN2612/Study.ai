from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.models import User
from app.auth.schemas import RegisterRequest,LoginRequest,Token
from app.auth import service

router = APIRouter(prefix="/auth",tags=["auth"])

@router.post("/register")
def register(request:RegisterRequest,db:Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user :
        raise HTTPException(status_code = 400,detail="Email already registered")
    
    hashed = service.hash_password(request.password)
    
    new_user = User(email=request.email,hashed_pw = hashed)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message":"registered sucessfully"}

@router.post("/login")
def login(request:LoginRequest,db: Session=Depends(get_db)):
        user_login = db.query(User).filter(User.email == request.email).first()
        if not user_login:
            raise HTTPException(status_code=401,detail="Invalid credentials")
        check = service.verify_password(request.password,user_login.hashed_pw)
        if not check:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = service.create_access_token(user_login.id)
        return Token(access_token=token,token_type="bearer")
    
    
        
