from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from .. import models, database, schemas, utils

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_current_admin_or_superadmin(
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user

@router.get("/branch-data")
def get_branch_analytics(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin)
) -> Dict:
    data = {}

    user_query = db.query(models.User)
    trainer_query = db.query(models.Trainer)

    if current_admin.role == "admin":
        user_query = user_query.filter(models.User.branch == current_admin.branch)
        trainer_query = trainer_query.filter(models.Trainer.branch_name == current_admin.branch)

    users = user_query.all()
    trainers = trainer_query.all()

    data["users"] = {
        "total": len(users),
        "by_gender": {
            "male": sum(1 for u in users if (u.gender or "").lower() == "male"),
            "female": sum(1 for u in users if (u.gender or "").lower() == "female"),
            "other": sum(1 for u in users if (u.gender or "").lower() not in ["male", "female"]),
        },
        "by_role": {
            role: sum(1 for u in users if u.role == role)
            for role in set(u.role for u in users)
        }
    }

    data["trainers"] = {
        "total": len(trainers),
        "by_specialization": {},
    }
    for t in trainers:
        specs = t.specialization.split(",") if t.specialization else []
        for s in specs:
            s = s.strip()
            if s:
                data["trainers"]["by_specialization"][s] = data["trainers"]["by_specialization"].get(s, 0) + 1

    return data
