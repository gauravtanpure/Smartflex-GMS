# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, schemas, database, utils

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)
):
    # Try to find user in the 'users' table
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if user and utils.verify_password(form_data.password, user.password):
        # Successful login for a User
        access_token_expires = utils.timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={"sub": user.email, "role": user.role, "branch": user.branch, "id": user.id}, # ADDED 'id': user.id
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_data": schemas.UserResponse(
                id=user.id, # ADDED: Pass the user's ID
                name=user.name,
                email=user.email,
                phone=user.phone,
                role=user.role,
                branch=user.branch
            ),
        }

    # If not found in 'users', try to find in the 'trainers' table
    trainer = db.query(models.Trainer).filter(models.Trainer.email == form_data.username).first()
    if trainer and utils.verify_password(form_data.password, trainer.password):
        # Successful login for a Trainer
        access_token_expires = utils.timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={"sub": trainer.email, "role": "trainer", "branch": trainer.branch_name, "id": trainer.id}, # ADDED 'id': trainer.id
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_data": schemas.UserResponse( # Re-using UserResponse for simplicity, adjust if trainer-specific response needed
                id=trainer.id, # ADDED: Pass the trainer's ID
                name=trainer.name,
                email=trainer.email,
                phone=trainer.phone,
                role="trainer", # Role is 'trainer'
                branch=trainer.branch_name
            ),
        }

    # If neither user nor trainer found or password incorrect
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: schemas.UserResponse = Depends(utils.get_current_user), # Use get_current_user for token decoding
):
    return current_user
