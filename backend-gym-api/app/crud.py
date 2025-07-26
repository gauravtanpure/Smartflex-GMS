# backend/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from passlib.hash import bcrypt
from typing import Optional, List, Dict, Any # Import for type hinting

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
        branch=user.branch
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# NEW: CRUD operations for Member
def get_member_profile_by_user_id(db: Session, user_id: int):
    return db.query(models.Member).filter(models.Member.user_id == user_id).first()

def create_member_profile(db: Session, user_id: int, profile_data: schemas.MemberCreate):
    db_member = models.Member(user_id=user_id)

    for field, value in profile_data.dict(exclude_unset=True).items():
        if field == "references":
            if value and len(value) > 0:
                db_member.reference1 = value[0]
            if value and len(value) > 1:
                db_member.reference2 = value[1]
        elif field in ["residential_address", "office_address", "do_you_have_condition"]:
            setattr(db_member, field, value.dict() if value else None)
        else:
            setattr(db_member, field, value)

    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def update_member_profile(db: Session, db_member: models.Member, profile_data: schemas.MemberCreate):
    for field, value in profile_data.dict(exclude_unset=True).items():
        if field == "references":
            if value and len(value) > 0:
                db_member.reference1 = value[0]
            else:
                db_member.reference1 = None
            if value and len(value) > 1:
                db_member.reference2 = value[1]
            else:
                db_member.reference2 = None
        elif field in ["residential_address", "office_address", "do_you_have_condition"]:
            setattr(db_member, field, value.dict() if value else None)
        else:
            setattr(db_member, field, value)

    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member_profile(db: Session, user_id: int):
    db_member = db.query(models.Member).filter(models.Member.user_id == user_id).first()
    if db_member:
        db.delete(db_member)
        db.commit()
        return True
    return False