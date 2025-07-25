from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str
    branch: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    name: str
    email: EmailStr
    phone: str
    role: str
    branch: Optional[str]

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class TrainerCreate(BaseModel):
    name: str
    specialization: List[str]
    rating: float = 0.0
    experience: int = 0
    phone: str
    email: EmailStr
    password: str  # ✅ Added
    availability: Optional[str] = None
    branch_name: Optional[str] = None


class TrainerResponse(BaseModel):
    id: int
    name: str
    specialization: List[str]
    rating: float
    experience: int
    phone: str
    email: EmailStr
    availability: Optional[str]
    branch_name: Optional[str]

    class Config:
        orm_mode = True
