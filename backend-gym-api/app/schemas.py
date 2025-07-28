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

class MemberCreate(BaseModel):
    user_id: int

    name_full: str
    surname: str
    first_name: str
    fathers_name: str

    # Residential Address
    res_flat_no: str
    res_wing: str
    res_floor: str
    res_bldg_name: str
    res_street: str
    res_landmark: str
    res_area: str
    res_pin_code: str

    # Office Address
    off_office_no: str
    off_wing: str
    off_floor: str
    off_bldg_name: str
    off_street: str
    off_landmark: str
    off_area: str
    off_pin_code: str

    telephone_res: str
    telephone_office: str
    mobile: str
    email: str
    date_of_birth: str
    blood_group: str
    marital_status: str
    wedding_anniversary_date: str

    reference1: str
    reference2: str

    physician_name: str
    physician_contact: str
    physician_mobile: str
    physician_tel: str
    medications: str
    participating_in_exercise_program_reason: str
    describe_physical_activity: str
    any_other_condition_detail: str
    comments: str

    informed_consent_agreed: bool
    rules_regulations_agreed: bool

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
