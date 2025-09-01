from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import schemas, database, models
from dotenv import load_dotenv
import os

load_dotenv()

# Configuration for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "Gaurav@9172951183@2003")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # Point to your login endpoint

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Extract email, role, and branch
        email: str = payload.get("sub")
        role: str = payload.get("role")
        branch: Optional[str] = payload.get("branch") # Extract branch
        if email is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return schemas.TokenData(email=email, role=role, branch=branch) # Return TokenData
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)
):
    token_data = decode_access_token(token)
    
    # Try to find user in the 'users' table
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user:
        return schemas.UserResponse(
            id=user.id, # <--- ADDED: Pass the user's ID
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            branch=user.branch
        )
    
    # If not a regular user, try to find in the 'trainers' table
    trainer = db.query(models.Trainer).filter(models.Trainer.email == token_data.email).first()
    if trainer:
        return schemas.UserResponse( # Re-use UserResponse for trainer data in token
            id=trainer.id, # <--- ADDED: Pass the trainer's ID
            name=trainer.name,
            email=trainer.email,
            phone=trainer.phone,
            role="trainer", # Explicitly set role as 'trainer'
            branch=trainer.branch_name
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not find user or trainer for authenticated token",
        headers={"WWW-Authenticate": "Bearer"},
    )

