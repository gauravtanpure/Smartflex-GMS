from sqlalchemy.orm import Session
from . import models, schemas
from passlib.hash import bcrypt

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = bcrypt.hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
        phone=user.phone,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
