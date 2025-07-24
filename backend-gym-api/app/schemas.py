from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str
    branch: str  # ✅ Add this line

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    name: str
    email: EmailStr
    phone: str
    role: str

    class Config:
        orm_mode = True
