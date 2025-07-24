# backend/app/auth.py
from fastapi import APIRouter, Depends, HTTPException, status # Ensure status is imported
from sqlalchemy.orm import Session
from .. import models, schemas, database, utils

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.UserResponse) # <--- CRITICAL: Add response_model
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not utils.verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return the user data formatted according to UserResponse schema
    return schemas.UserResponse(
        name=db_user.name,
        email=db_user.email,
        phone=db_user.phone,
        role=db_user.role,
        branch=db_user.branch # <--- Ensure db_user.branch is included
    )