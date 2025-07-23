from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, utils

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = utils.hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_pwd,
        phone=user.phone,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}
