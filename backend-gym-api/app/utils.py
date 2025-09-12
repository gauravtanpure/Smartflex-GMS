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
# --- NEW IMPORTS FOR EMAIL ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# --- END NEW IMPORTS ---

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

# --- NEW FUNCTION FOR SENDING EMAILS ---
def send_email(to_email: str, subject: str, html_content: str):
    """
    Sends an HTML email using SMTP settings from environment variables.
    """
    # Get email configuration from environment variables
    email_host = os.getenv("EMAIL_HOST")
    email_port = int(os.getenv("EMAIL_PORT", 587))
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    email_from_name = os.getenv("EMAIL_FROM_NAME")

    if not all([email_host, email_port, email_user, email_pass, email_from_name]):
        print("Email configuration is missing. Skipping email sending.")
        return

    # Create the email message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{email_from_name} <{email_user}>"
    message["To"] = to_email

    # Attach the HTML content
    message.attach(MIMEText(html_content, "html"))

    try:
        # Connect to the SMTP server and send the email
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()  # Secure the connection
            server.login(email_user, email_pass)
            server.sendmail(email_user, to_email, message.as_string())
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
# --- END NEW FUNCTION ---