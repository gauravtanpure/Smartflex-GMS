from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, utils

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Login successful"}
