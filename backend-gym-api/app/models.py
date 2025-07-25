from sqlalchemy import Column, Integer, String, Float
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String)
    role = Column(String, default="member")
    branch = Column(String, nullable=True)


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    experience = Column(Integer, default=0)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # ✅ Added
    availability = Column(String, nullable=True)
    branch_name = Column(String, nullable=True)
