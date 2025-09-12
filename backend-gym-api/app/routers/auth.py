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
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if user and utils.verify_password(form_data.password, user.password):
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please check your inbox for a verification link.",
            )
        
        access_token_expires = utils.timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={"sub": user.email, "role": user.role, "branch": user.branch, "id": user.id},
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_data": schemas.UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                phone=user.phone,
                role=user.role,
                branch=user.branch
            ),
        }

    trainer = db.query(models.Trainer).filter(models.Trainer.email == form_data.username).first()
    if trainer and utils.verify_password(form_data.password, trainer.password):
        access_token_expires = utils.timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={"sub": trainer.email, "role": "trainer", "branch": trainer.branch_name, "id": trainer.id},
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_data": schemas.UserResponse(
                id=trainer.id,
                name=trainer.name,
                email=trainer.email,
                phone=trainer.phone,
                role="trainer",
                branch=trainer.branch_name
            ),
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: schemas.UserResponse = Depends(utils.get_current_user),
):
    return current_user