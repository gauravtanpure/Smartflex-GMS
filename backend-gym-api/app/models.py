# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Time # Import Time
from sqlalchemy.orm import relationship # Import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String)
    role = Column(String, default="member") # e.g., "member", "admin", "superadmin", "trainer"
    branch = Column(String, nullable=True) # Branch to which the user belongs

    # If you want to link attendance records to users
    # attendance_records = relationship("UserAttendance", back_populates="user")


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    experience = Column(Integer, default=0)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    availability = Column(String, nullable=True)
    branch_name = Column(String, nullable=True) # Branch to which the trainer belongs

    # Add relationship to SessionSchedule
    sessions = relationship("SessionSchedule", back_populates="trainer")


class UserAttendance(Base): # New Model for User Attendance
    __tablename__ = "user_attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Link to User model
    date = Column(Date) # Date of attendance
    status = Column(String) # e.g., "present", "absent", "late"
    branch = Column(String, nullable=True) # Store branch for easy filtering by trainer

    # Define relationship to User model
    # user = relationship("User", back_populates="attendance_records")

# New Model for Session Schedules
class SessionSchedule(Base):
    __tablename__ = "session_schedules"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    session_name = Column(String, nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    branch_name = Column(String, nullable=True) # Branch where the session is held
    max_capacity = Column(Integer, default=0)
    description = Column(String, nullable=True)

    # Define relationships
    trainer = relationship("Trainer", back_populates="sessions")
    session_attendances = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")


# New Model for Session Attendance
class SessionAttendance(Base):
    __tablename__ = "session_attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("session_schedules.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False) # e.g., "present", "absent", "late"
    attendance_date = Column(Date, nullable=False) # Date when attendance was marked for the session

    # Define relationships
    session = relationship("SessionSchedule", back_populates="session_attendances")
    user = relationship("User") # Link to User model


# models.py
class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    # Section A
    name_full = Column(String)
    surname = Column(String)
    first_name = Column(String)
    fathers_name = Column(String)

    # Residential Address
    res_flat_no = Column(String)
    res_wing = Column(String)
    res_floor = Column(String)
    res_bldg_name = Column(String)
    res_street = Column(String)
    res_landmark = Column(String)
    res_area = Column(String)
    res_pin_code = Column(String)

    # Office Address
    off_office_no = Column(String)
    off_wing = Column(String)
    off_floor = Column(String)
    off_bldg_name = Column(String)
    off_street = Column(String)
    off_landmark = Column(String)
    off_area = Column(String)
    off_pin_code = Column(String)

    telephone_res = Column(String)
    telephone_office = Column(String)
    mobile = Column(String)
    email = Column(String)
    date_of_birth = Column(String)
    blood_group = Column(String)
    marital_status = Column(String)
    wedding_anniversary_date = Column(String)

    reference1 = Column(String)
    reference2 = Column(String)

    # Section B
    physician_name = Column(String)
    physician_contact = Column(String)
    physician_mobile = Column(String)
    physician_tel = Column(String)
    medications = Column(String)
    participating_in_exercise_program_reason = Column(String)
    describe_physical_activity = Column(String)
    any_other_condition_detail = Column(String)
    comments = Column(String)

    # Section C
    informed_consent_agreed = Column(String)
    rules_regulations_agreed = Column(String)


from sqlalchemy import Boolean, DateTime, func

class FeeAssignment(Base):
    __tablename__ = "fee_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_name = Column(String, nullable=False)
    fee_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    notification_type = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
