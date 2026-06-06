from pydantic import BaseModel

class RegisterRequest(BaseModel):
    email:str
    password:str
    
class LoginRequest(BaseModel):
    email:str
    password:str
    
class Token(BaseModel):
    access_token : str
    token_type : str
    
class TokenData(BaseModel):
    user_id : int
    