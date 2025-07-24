from pydantic import BaseModel, EmailStr
from typing import Optional # Import Optional for nullable fields


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str
    branch: Optional[str] = None # Make branch optional for creation if not always present

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# New schema for successful login response
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    branch: Optional[str] = None # `branch` can be null for 'superadmin' and some members

class UserResponse(BaseModel):
    name: str
    email: EmailStr
    phone: str
    role: str
    branch: Optional[str] # Added branch to user response, making it optional

    class Config:
        orm_mode = True