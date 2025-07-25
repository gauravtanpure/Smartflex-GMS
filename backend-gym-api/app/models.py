# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey # Import Date and ForeignKey
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


class UserAttendance(Base): # New Model for User Attendance
    __tablename__ = "user_attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Link to User model
    date = Column(Date) # Date of attendance
    status = Column(String) # e.g., "present", "absent", "late"
    branch = Column(String, nullable=True) # Store branch for easy filtering by trainer

    # Define relationship to User model
    # user = relationship("User", back_populates="attendance_records")