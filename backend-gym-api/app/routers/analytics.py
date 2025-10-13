# backend/routers/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timedelta
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
    plan_query = db.query(models.MembershipPlan)
    
    if current_admin.role == "admin":
        user_query = user_query.filter(models.User.branch == current_admin.branch)
        trainer_query = trainer_query.filter(models.Trainer.branch_name == current_admin.branch)
        plan_query = plan_query.filter(models.MembershipPlan.branch_name == current_admin.branch)

    users = user_query.all()
    trainers = trainer_query.all()
    plans = plan_query.all()
    
    # --- User Analytics Data ---
    data["users"] = {
        "total": len(users),
        "by_gender": {
            "Male": sum(1 for u in users if (u.gender or "").lower() == "male"),
            "Female": sum(1 for u in users if (u.gender or "").lower() == "female"),
            "Other": sum(1 for u in users if (u.gender or "").lower() not in ["male", "female"]),
        },
        "by_role": {
            role: sum(1 for u in users if u.role == role)
            for role in set(u.role for u in users)
        }
    }
    
    # --- Membership Plan Analytics Data ---
    data["plans"] = {
        "by_status": {
            "Active": sum(1 for p in plans if p.is_approved),
            "Not Active": sum(1 for p in plans if not p.is_approved)
        }
    }

    # --- Trainer and Class Analytics Data ---
    data["trainers"] = {
        "total": len(trainers),
        "by_specialization": {},
        "by_branch": {},
        "top_rated": []
    }
    
    for t in trainers:
        # Specialization breakdown
        specs = t.specialization.split(",") if t.specialization else []
        for s in specs:
            s = s.strip()
            if s:
                data["trainers"]["by_specialization"][s] = data["trainers"]["by_specialization"].get(s, 0) + 1
        
        # Trainers by Branch breakdown
        if t.branch_name:
            data["trainers"]["by_branch"][t.branch_name] = data["trainers"]["by_branch"].get(t.branch_name, 0) + 1
            
    # Top Rated Trainers
    top_trainers = trainer_query.order_by(models.Trainer.rating.desc()).limit(5).all()
    data["trainers"]["top_rated"] = [{"name": t.name, "rating": t.rating} for t in top_trainers]

    return data


@router.get("/user-plan-status")
def get_user_plan_status(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin)
) -> List[Dict]:
    """
    Returns a list of all users and their membership plan status.
    """
    user_plan_status = []
    users_query = db.query(models.User)
    
    if current_admin.role == "admin":
        users_query = users_query.filter(models.User.branch == current_admin.branch)
        
    users = users_query.all()

    for user in users:
        has_plan = len(user.fee_assignments) > 0
        user_plan_status.append({
            "user_id": user.id,
            "name": user.name,
            "has_plan": has_plan
        })
    return user_plan_status


@router.get("/users-inside-count")
def get_users_inside_count(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin)
) -> Dict:
    """
    Calculates the number of unique users who have marked attendance
    (status='present') in the last 90 minutes.
    """
    now = datetime.now()
    time_threshold = now - timedelta(minutes=90)
    
    # Base query for attendance records in the last day
    query = db.query(models.UserAttendance).filter(
        models.UserAttendance.status == "present",
        models.UserAttendance.date >= time_threshold.date(),
        models.UserAttendance.time != None
    )
    
    # Filter by branch for the admin role
    if current_admin.role == "admin":
        if not current_admin.branch:
             raise HTTPException(status_code=400, detail="Admin's branch is not specified.")
        query = query.filter(models.UserAttendance.branch == current_admin.branch)
    
    # Fetch potential records and filter precisely in Python
    recent_attendances = query.all()
    
    unique_user_ids = set()
    for attendance in recent_attendances:
        # Combine date and time from the record to create a full datetime object
        attendance_datetime = datetime.combine(attendance.date, attendance.time)
        if attendance_datetime >= time_threshold:
            unique_user_ids.add(attendance.user_id)
            
    return {"users_inside_count": len(unique_user_ids)}