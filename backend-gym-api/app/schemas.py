from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, time, datetime # Import datetime

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
    id: int
    name: str
    email: EmailStr
    phone: str
    role: str
    branch: Optional[str] = None

    class Config:
        from_attributes = True # Changed from orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    branch: Optional[str] = None


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
    branch_name: Optional[str]

    class Config:
        from_attributes = True # Changed from orm_mode = True


# --- New Schemas for User Attendance ---

class UserAttendanceCreate(BaseModel):
    user_id: int
    date: date
    status: str

class UserAttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    status: str
    branch: Optional[str]

    class Config:
        from_attributes = True # Changed from orm_mode = True

# --- Schemas for Session Schedule ---
class SessionScheduleCreate(BaseModel):
    session_name: str
    session_date: date
    start_time: time
    end_time: time
    max_capacity: int
    description: Optional[str] = None

class SessionScheduleResponse(BaseModel):
    id: int
    trainer_id: int
    session_name: str
    session_date: date
    start_time: time
    end_time: time
    branch_name: Optional[str]
    max_capacity: int
    description: Optional[str] = None

    class Config:
        from_attributes = True # Changed from orm_mode = True

# --- Schemas for Session Attendance ---
class SessionAttendanceCreate(BaseModel):
    session_id: int
    user_id: int
    status: str
    attendance_date: date

class SessionAttendanceResponse(BaseModel):
    id: int
    session_id: int
    user_id: int
    status: str
    attendance_date: date
    user: UserResponse

    class Config:
        from_attributes = True # Changed from orm_mode = True


class MemberCreate(BaseModel):
    user_id: int

    name_full: str
    surname: str
    first_name: str
    fathers_name: str

    res_flat_no: str
    res_wing: str
    res_floor: str
    res_bldg_name: str
    res_street: str
    res_landmark: str
    res_area: str
    res_pin_code: str

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

class FeeAssignmentCreate(BaseModel):
    user_id: int
    fee_type: str
    amount: float
    due_date: date

class FeeAssignmentResponse(BaseModel):
    id: int
    user_id: int
    assigned_by_user_id: int
    branch_name: str
    fee_type: str
    amount: float
    due_date: date
    is_paid: bool
    created_at: datetime
    updated_at: datetime
    user: UserResponse # Add nested UserResponse schema

    class Config:
        from_attributes = True # Changed from orm_mode = True

class FeeAssignmentUpdate(BaseModel):
    fee_type: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[date] = None
    is_paid: Optional[bool] = None

class UserNotificationCreate(BaseModel):
    user_id: int
    message: str
    notification_type: Optional[str] = None

class UserNotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notification_type: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True # Changed from orm_mode = True

class UserNotificationUpdate(BaseModel):
    is_read: bool

class UserFeesResponse(BaseModel):
    id: int
    fee_type: str
    amount: float
    due_date: date
    is_paid: bool
    assigned_by_name: str
    branch_name: str

    class Config:
        from_attributes = True # Changed from orm_mode = True

# --- New Schemas for Diet Plan ---
class DietPlanCreate(BaseModel):
    user_id: int
    title: str
    description: str
    expiry_date: Optional[date] = None

class DietPlanResponse(BaseModel):
    id: int
    user_id: int
    assigned_by_trainer_id: int
    title: str
    description: str
    assigned_date: date
    expiry_date: Optional[date] = None
    branch_name: Optional[str] = None
    user: UserResponse # Nested UserResponse
    assigned_by_trainer: TrainerResponse # Nested TrainerResponse

    class Config:
        from_attributes = True # Changed from orm_mode = True

# --- New Schemas for Exercise Plan ---
class ExercisePlanCreate(BaseModel):
    user_id: int
    title: str
    description: str
    expiry_date: Optional[date] = None

class ExercisePlanResponse(BaseModel):
    id: int
    user_id: int
    assigned_by_trainer_id: int
    title: str
    description: str
    assigned_date: date
    expiry_date: Optional[date] = None
    branch_name: Optional[str] = None
    user: UserResponse # Nested UserResponse
    assigned_by_trainer: TrainerResponse # Nested TrainerResponse

    class Config:
        from_attributes = True # Changed from orm_mode = True

# --- Schemas for Membership Plans ---
class MembershipPlanCreate(BaseModel):
    plan_name: str
    description: Optional[str] = None
    price: float
    duration_months: int
    branch_name: Optional[str] = None # Allow setting branch for superadmin

class MembershipPlanResponse(BaseModel):
    id: int
    plan_name: str
    description: Optional[str] = None
    price: float
    duration_months: int
    branch_name: Optional[str] = None
    is_approved: bool # ⬅️ NEW FIELD
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MembershipPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_months: Optional[int] = None
    is_approved: Optional[bool] = None # ⬅️ NEW FIELD for update