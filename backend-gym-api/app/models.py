from sqlalchemy import Column, Integer, String
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String) # Hashed password
    phone = Column(String)
    role = Column(String, default="member") # Added default value for role
    branch = Column(String, nullable=True)  # Set branch as nullable, as seen in your DB image