from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date # Import date for attendance date field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str # Consider a default or validation for roles
    branch: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel): # Updated to include branch and ID
    id: int # <--- ADD THIS LINE
    name: str
    email: EmailStr
    phone: str
    role: str
    branch: Optional[str] = None # Added branch

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: UserResponse # Contains name, email, role, branch, and ID


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    branch: Optional[str] = None # Added branch


class TrainerCreate(BaseModel):
    name: str
    specialization: List[str]
    rating: float = 0.0
    experience: int = 0
    phone: str
    email: EmailStr
    password: str
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
    branch_name: Optional[str] # Added branch_name

    class Config:
        orm_mode = True


# --- New Schemas for User Attendance ---

class UserAttendanceCreate(BaseModel):
    user_id: int
    date: date # Use date type for actual date objects
    status: str # e.g., "present", "absent", "late"
    # branch will be determined by the trainer's branch on the backend


class UserAttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    status: str
    branch: Optional[str] # Include branch in response

    class Config:
        orm_mode = True
