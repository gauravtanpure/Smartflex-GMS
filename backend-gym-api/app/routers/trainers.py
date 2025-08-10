# routers/trainers.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, time
from .. import models, schemas, database, utils
from sqlalchemy import and_
from sqlalchemy.orm import joinedload


router = APIRouter(prefix="/trainers", tags=["Trainers"])

def get_current_active_user(
    current_user: schemas.UserResponse = Depends(utils.get_current_user),
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

def get_current_trainer(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only trainers can access this.",
        )
    return current_user

def get_current_admin_or_superadmin(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only admins or superadmins can access this.",
        )
    return current_user

def get_current_admin(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only admins can access this.",
        )
    return current_user

def get_current_superadmin(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only superadmins can access this.",
        )
    return current_user

@router.post("/sessions", response_model=schemas.SessionScheduleResponse)
def create_session(
    session: schemas.SessionScheduleCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to create a new session schedule.
    The session will be associated with the trainer's ID and branch.
    """
    if not current_trainer.branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified. Cannot create session."
        )

    new_session = models.SessionSchedule(
        trainer_id=current_trainer.id,
        session_name=session.session_name,
        session_date=session.session_date,
        start_time=session.start_time,
        end_time=session.end_time,
        branch_name=current_trainer.branch,
        max_capacity=session.max_capacity,
        description=session.description
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/pending-revenue-approvals", response_model=List[schemas.TrainerResponse])
def get_pending_revenue_approvals(
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin),
):
    pending_trainers = db.query(models.Trainer).filter(models.Trainer.is_approved_by_superadmin == False).all()
    
    # ⬅️ UPDATED LOGIC
    # Construct a list of TrainerResponse objects to ensure all fields are included
    trainers_with_schema = []
    for t in pending_trainers:
        t.specialization = t.specialization.split(",") if isinstance(t.specialization, str) and t.specialization else []
        trainers_with_schema.append(schemas.TrainerResponse.from_orm(t))
    
    return trainers_with_schema

@router.get("/sessions", response_model=List[schemas.SessionScheduleResponse])
def get_trainer_sessions(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to view all sessions they have created.
    """
    sessions = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.trainer_id == current_trainer.id
    ).all()
    return sessions

@router.get("/public-sessions", response_model=List[schemas.SessionScheduleResponse])
def get_public_sessions(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Allows any authenticated user to view all available session schedules.
    """
    sessions = db.query(models.SessionSchedule).all()
    return sessions

@router.put("/sessions/{session_id}", response_model=schemas.SessionScheduleResponse)
def update_session(
    session_id: int,
    session_update: schemas.SessionScheduleCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to update a session they have created.
    Ensures the session belongs to the current trainer.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id,
        models.SessionSchedule.trainer_id == current_trainer.id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not created by this trainer."
        )

    db_session.session_name = session_update.session_name
    db_session.session_date = session_update.session_date
    db_session.start_time = session_update.start_time
    db_session.end_time = session_update.end_time
    db_session.max_capacity = session_update.max_capacity
    db_session.description = session_update.description

    db.commit()
    db.refresh(db_session)
    return db_session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to delete a session they have created.
    Ensures the session belongs to the current trainer.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id,
        models.SessionSchedule.trainer_id == current_trainer.id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not created by this trainer."
        )

    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted successfully"}

@router.post("/sessions/{session_id}/attendance", response_model=schemas.SessionAttendanceResponse)
def mark_session_attendance(
    session_id: int,
    attendance_data: schemas.SessionAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Allows users to book sessions (mark their own attendance) and trainers to mark attendance for users.
    For regular users: they can only mark their own attendance.
    For trainers: they can mark attendance for any user in their branch.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    if current_user.role == "trainer":
        if db_session.trainer_id != current_user.id or db_session.branch_name != current_user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found, not created by this trainer, or not in trainer's branch."
            )

        user = db.query(models.User).filter(
            models.User.id == attendance_data.user_id,
            models.User.branch == current_user.branch
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in trainer's branch or does not exist."
            )
    else:
        if attendance_data.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark your own attendance."
            )

        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

    existing_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.user_id == attendance_data.user_id,
        models.SessionAttendance.attendance_date == attendance_data.attendance_date
    ).first()

    if existing_attendance:
        existing_attendance.status = attendance_data.status
        db.commit()
        db.refresh(existing_attendance)
        existing_attendance.user = user
        return existing_attendance

    new_attendance = models.SessionAttendance(
        session_id=session_id,
        user_id=attendance_data.user_id,
        status=attendance_data.status,
        attendance_date=attendance_data.attendance_date
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    new_attendance.user = user
    return new_attendance

@router.get("/sessions/{session_id}/attendance", response_model=List[schemas.SessionAttendanceResponse])
def get_session_attendance(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    user_id: Optional[int] = None,
    attendance_date: Optional[date] = None,
):
    """
    Allows trainers to view attendance records for their sessions.
    Allows regular users to view their own attendance records for any session.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    if current_user.role == "trainer":
        if db_session.trainer_id != current_user.id or db_session.branch_name != current_user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found, not created by this trainer, or not in trainer's branch."
            )

        query = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session_id
        ).join(models.User, models.SessionAttendance.user_id == models.User.id)

        if user_id:
            query = query.filter(models.SessionAttendance.user_id == user_id)
        if attendance_date:
            query = query.filter(models.SessionAttendance.attendance_date == attendance_date)
    else:
        query = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session_id,
            models.SessionAttendance.user_id == current_user.id
        ).join(models.User, models.SessionAttendance.user_id == models.User.id)

        if attendance_date:
            query = query.filter(models.SessionAttendance.attendance_date == attendance_date)

    attendance_records = query.all()

    for record in attendance_records:
        record.user = db.query(models.User).filter(models.User.id == record.user_id).first()

    return attendance_records

@router.put("/sessions/attendance/{attendance_id}", response_model=schemas.SessionAttendanceResponse)
def update_session_attendance(
    attendance_id: int,
    attendance_data: schemas.SessionAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Allows trainers to update attendance records for their sessions.
    Allows regular users to update their own attendance records.
    """
    db_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.id == attendance_id
    ).first()

    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found."
        )

    if current_user.role == "trainer":
        db_session = db.query(models.SessionSchedule).filter(
            models.SessionSchedule.id == db_attendance.session_id,
            models.SessionSchedule.trainer_id == current_user.id,
            models.SessionSchedule.branch_name == current_user.branch
        ).first()

        if not db_session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this attendance record (session not found or not yours)."
            )

        if attendance_data.user_id != db_attendance.user_id:
            user = db.query(models.User).filter(
                models.User.id == attendance_data.user_id,
                models.User.branch == current_user.branch
            ).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="New user_id not found in trainer's branch or does not exist."
                )
            db_attendance.user_id = attendance_data.user_id
    else:
        if db_attendance.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own attendance records."
            )

        if attendance_data.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot change the user_id for attendance records."
            )

    db_attendance.status = attendance_data.status
    db_attendance.attendance_date = attendance_data.attendance_date

    db.commit()
    db.refresh(db_attendance)
    db_attendance.user = db.query(models.User).filter(models.User.id == db_attendance.user_id).first()
    return db_attendance

@router.delete("/sessions/attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session_attendance(
    attendance_id: int,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Allows trainers to delete attendance records for their sessions.
    Allows regular users to delete their own attendance records (cancel booking).
    """
    db_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.id == attendance_id
    ).first()

    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found."
        )

    if current_user.role == "trainer":
        db_session = db.query(models.SessionSchedule).filter(
            models.SessionSchedule.id == db_attendance.session_id,
            models.SessionSchedule.trainer_id == current_user.id,
            models.SessionSchedule.branch_name == current_user.branch
        ).first()

        if not db_session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this attendance record (session not found or not yours)."
            )
    else:
        if db_attendance.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own session bookings."
            )

    db.delete(db_attendance)
    db.commit()
    return {"message": "Session deleted successfully"}

#PTO requests

from sqlalchemy.orm import joinedload
from sqlalchemy import and_

@router.post("/pto-request", response_model=schemas.PTORequestResponse)
def create_pto_request(
    request_data: schemas.PTORequestCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    if not current_trainer.branch:
        raise HTTPException(status_code=400, detail="Trainer's branch is not set.")

    # Prevent overlapping PTOs
    overlap = db.query(models.PTORequest).filter(
        models.PTORequest.trainer_id == current_trainer.id,
        models.PTORequest.status != "rejected",
        and_(
            request_data.start_date <= models.PTORequest.end_date,
            request_data.end_date >= models.PTORequest.start_date
        )
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail="Overlapping PTO request already exists.")

    new_pto = models.PTORequest(
        trainer_id=current_trainer.id,
        branch_name=current_trainer.branch,
        start_date=request_data.start_date,
        end_date=request_data.end_date,
        reason=request_data.reason,
        status="pending"
    )

    db.add(new_pto)
    db.commit()
    db.refresh(new_pto)

    # Convert specialization string to list if trainer is loaded
    if new_pto.trainer and isinstance(new_pto.trainer.specialization, str):
        new_pto.trainer.specialization = [
            s.strip() for s in new_pto.trainer.specialization.split(",")
        ]

    return new_pto


@router.get("/my-pto-requests", response_model=List[schemas.PTORequestResponse])
def get_my_pto_requests(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    pto_requests = (
        db.query(models.PTORequest)
        .options(joinedload(models.PTORequest.trainer))
        .filter(models.PTORequest.trainer_id == current_trainer.id)
        .order_by(models.PTORequest.created_at.desc())
        .all()
    )

    # Ensure specialization is returned as a list
    for req in pto_requests:
        if req.trainer and isinstance(req.trainer.specialization, str):
            req.trainer.specialization = [
                s.strip() for s in req.trainer.specialization.split(",")
            ]

    return pto_requests



@router.get("/pto-requests", response_model=List[schemas.PTORequestResponse])
def get_all_pto_requests_for_admin(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin),
):
    query = db.query(models.PTORequest).join(models.Trainer).options(
        joinedload(models.PTORequest.trainer)
    )

    if current_admin.role == "admin":
        query = query.filter(models.PTORequest.branch_name == current_admin.branch)

    results = query.order_by(models.PTORequest.created_at.desc()).all()

    # Convert specialization string into list for API response
    for req in results:
        if req.trainer and isinstance(req.trainer.specialization, str):
            req.trainer.specialization = req.trainer.specialization.split(",")
    return results


from sqlalchemy.orm import joinedload

@router.put("/pto-request/{request_id}/approve", response_model=schemas.PTORequestResponse)
def approve_pto_request(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin),
):
    pto = (
        db.query(models.PTORequest)
        .options(joinedload(models.PTORequest.trainer))
        .filter(models.PTORequest.id == request_id)
        .first()
    )

    if not pto:
        raise HTTPException(status_code=404, detail="PTO request not found.")

    if current_admin.role == "admin" and pto.branch_name != current_admin.branch:
        raise HTTPException(status_code=403, detail="Not authorized to approve this request.")

    pto.status = "approved"
    pto.approved_by_admin_id = current_admin.id
    db.commit()
    db.refresh(pto)

    # Convert specialization string → list
    if pto.trainer and isinstance(pto.trainer.specialization, str):
        pto.trainer.specialization = [
            s.strip() for s in pto.trainer.specialization.split(",")
        ]

    return pto


@router.put("/pto-request/{request_id}/reject", response_model=schemas.PTORequestResponse)
def reject_pto_request(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin),
):
    pto = (
        db.query(models.PTORequest)
        .options(joinedload(models.PTORequest.trainer))
        .filter(models.PTORequest.id == request_id)
        .first()
    )

    if not pto:
        raise HTTPException(status_code=404, detail="PTO request not found.")

    if current_admin.role == "admin" and pto.branch_name != current_admin.branch:
        raise HTTPException(status_code=403, detail="Not authorized to reject this request.")

    pto.status = "rejected"
    pto.approved_by_admin_id = current_admin.id
    db.commit()
    db.refresh(pto)

    # Convert specialization string → list
    if pto.trainer and isinstance(pto.trainer.specialization, str):
        pto.trainer.specialization = [
            s.strip() for s in pto.trainer.specialization.split(",")
        ]

    return pto

    
@router.post("/diet-plans", response_model=schemas.DietPlanResponse)
def create_diet_plan(
    diet_plan: schemas.DietPlanCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to assign a new diet plan to a user in their branch.
    """
    user = db.query(models.User).filter(
        models.User.id == diet_plan.user_id,
        models.User.branch == current_trainer.branch
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in trainer's branch or does not exist."
        )

    new_diet_plan = models.DietPlan(
        user_id=diet_plan.user_id,
        assigned_by_trainer_id=current_trainer.id,
        title=diet_plan.title,
        description=diet_plan.description,
        expiry_date=diet_plan.expiry_date,
        branch_name=current_trainer.branch
    )
    db.add(new_diet_plan)

    notification_message_trainer = f"You have assigned a new diet plan titled '{new_diet_plan.title}' to {user.name}."
    notification_trainer = models.UserNotification(
        user_id=current_trainer.id,
        message=notification_message_trainer,
        notification_type="diet_plan_assigned"
    )
    db.add(notification_trainer)

    notification_message_user = f"You have been assigned a new diet plan titled '{new_diet_plan.title}' by {current_trainer.name}."
    notification_user = models.UserNotification(
        user_id=diet_plan.user_id,
        message=notification_message_user,
        notification_type="diet_plan_assigned_to_user"
    )
    db.add(notification_user)

    db.commit()
    db.refresh(new_diet_plan)

    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == current_trainer.id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=current_trainer.id,
            name=current_trainer.name,
            specialization=[],
            rating=0.0, experience=0, phone="", email="", availability=None, branch_name=current_trainer.branch
        )

    return schemas.DietPlanResponse(
        id=new_diet_plan.id,
        user_id=new_diet_plan.user_id,
        assigned_by_trainer_id=new_diet_plan.assigned_by_trainer_id,
        title=new_diet_plan.title,
        description=new_diet_plan.description,
        assigned_date=new_diet_plan.assigned_date,
        expiry_date=new_diet_plan.expiry_date,
        branch_name=new_diet_plan.branch_name,
        user=schemas.UserResponse.from_orm(user),
        assigned_by_trainer=trainer_schema
    )

@router.put("/diet-plans/{plan_id}", response_model=schemas.DietPlanResponse)
def update_diet_plan(
    plan_id: int,
    diet_plan_update: schemas.DietPlanCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to update a diet plan they have assigned.
    Ensures the plan belongs to the current trainer and their branch.
    """
    db_diet_plan = db.query(models.DietPlan).filter(
        models.DietPlan.id == plan_id,
        models.DietPlan.assigned_by_trainer_id == current_trainer.id,
        models.DietPlan.branch_name == current_trainer.branch
    ).first()

    if not db_diet_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet plan not found or not assigned by this trainer in this branch."
        )

    if diet_plan_update.user_id != db_diet_plan.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User of a diet plan cannot be changed after assignment."
        )

    db_diet_plan.title = diet_plan_update.title
    db_diet_plan.description = diet_plan_update.description
    db_diet_plan.expiry_date = diet_plan_update.expiry_date

    db.commit()
    db.refresh(db_diet_plan)

    user = db.query(models.User).filter(models.User.id == db_diet_plan.user_id).first()
    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == db_diet_plan.assigned_by_trainer_id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=db_diet_plan.assigned_by_trainer_id, name="Unknown Trainer", specialization=[], rating=0.0, experience=0, phone="", email="", availability=None, branch_name=None
        )

    return schemas.DietPlanResponse(
        id=db_diet_plan.id,
        user_id=db_diet_plan.user_id,
        assigned_by_trainer_id=db_diet_plan.assigned_by_trainer_id,
        title=db_diet_plan.title,
        description=db_diet_plan.description,
        assigned_date=db_diet_plan.assigned_date,
        expiry_date=db_diet_plan.expiry_date,
        branch_name=db_diet_plan.branch_name,
        user=schemas.UserResponse.from_orm(user),
        assigned_by_trainer=trainer_schema
    )

@router.delete("/diet-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diet_plan(
    plan_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to delete a diet plan they have assigned.
    Ensures the plan belongs to the current trainer and their branch.
    """
    db_diet_plan = db.query(models.DietPlan).filter(
        models.DietPlan.id == plan_id,
        models.DietPlan.assigned_by_trainer_id == current_trainer.id,
        models.DietPlan.branch_name == current_trainer.branch
    ).first()

    if not db_diet_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet plan not found or not assigned by this trainer in this branch."
        )

    db.delete(db_diet_plan)
    db.commit()
    return {"message": "Diet plan deleted successfully"}

@router.get("/diet-plans", response_model=List[schemas.DietPlanResponse])
def get_trainer_diet_plans(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
    user_id: Optional[int] = None
):
    """
    Allows a trainer to view diet plans assigned by them, optionally filtered by user.
    """
    query = db.query(models.DietPlan).filter(
        models.DietPlan.assigned_by_trainer_id == current_trainer.id,
        models.DietPlan.branch_name == current_trainer.branch
    ).join(models.User, models.DietPlan.user_id == models.User.id)

    if user_id:
        query = query.filter(models.DietPlan.user_id == user_id)

    diet_plans = query.all()

    result = []
    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == current_trainer.id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=current_trainer.id,
            name=current_trainer.name,
            specialization=[],
            rating=0.0, experience=0, phone="", email="", availability=None, branch_name=current_trainer.branch
        )

    for dp in diet_plans:
        dp_dict = dp.__dict__.copy()
        dp_dict['user'] = schemas.UserResponse.from_orm(db.query(models.User).filter(models.User.id == dp.user_id).first())
        dp_dict['assigned_by_trainer'] = trainer_schema
        result.append(schemas.DietPlanResponse(**dp_dict))
    return result

@router.post("/exercise-plans", response_model=schemas.ExercisePlanResponse)
def create_exercise_plan(
    exercise_plan: schemas.ExercisePlanCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to assign a new exercise plan to a user in their branch.
    """
    user = db.query(models.User).filter(
        models.User.id == exercise_plan.user_id,
        models.User.branch == current_trainer.branch
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in trainer's branch or does not exist."
        )

    new_exercise_plan = models.ExercisePlan(
        user_id=exercise_plan.user_id,
        assigned_by_trainer_id=current_trainer.id,
        title=exercise_plan.title,
        description=exercise_plan.description,
        expiry_date=exercise_plan.expiry_date,
        branch_name=current_trainer.branch
    )
    db.add(new_exercise_plan)

    notification_message_trainer = f"You have assigned a new exercise plan titled '{new_exercise_plan.title}' to {user.name}."
    notification_trainer = models.UserNotification(
        user_id=current_trainer.id,
        message=notification_message_trainer,
        notification_type="exercise_plan_assigned"
    )
    db.add(notification_trainer)

    notification_message_user = f"You have been assigned a new exercise plan titled '{new_exercise_plan.title}' by {current_trainer.name}."
    notification_user = models.UserNotification(
        user_id=exercise_plan.user_id,
        message=notification_message_user,
        notification_type="exercise_plan_assigned_to_user"
    )
    db.add(notification_user)

    db.commit()
    db.refresh(new_exercise_plan)

    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == current_trainer.id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=current_trainer.id,
            name=current_trainer.name,
            specialization=[],
            rating=0.0, experience=0, phone="", email="", availability=None, branch_name=current_trainer.branch
        )

    return schemas.ExercisePlanResponse(
        id=new_exercise_plan.id,
        user_id=new_exercise_plan.user_id,
        assigned_by_trainer_id=new_exercise_plan.assigned_by_trainer_id,
        title=new_exercise_plan.title,
        description=new_exercise_plan.description,
        assigned_date=new_exercise_plan.assigned_date,
        expiry_date=new_exercise_plan.expiry_date,
        branch_name=new_exercise_plan.branch_name,
        user=schemas.UserResponse.from_orm(user),
        assigned_by_trainer=trainer_schema
    )

@router.put("/exercise-plans/{plan_id}", response_model=schemas.ExercisePlanResponse)
def update_exercise_plan(
    plan_id: int,
    exercise_plan_update: schemas.ExercisePlanCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to update an exercise plan they have assigned.
    Ensures the plan belongs to the current trainer and their branch.
    """
    db_exercise_plan = db.query(models.ExercisePlan).filter(
        models.ExercisePlan.id == plan_id,
        models.ExercisePlan.assigned_by_trainer_id == current_trainer.id,
        models.ExercisePlan.branch_name == current_trainer.branch
    ).first()

    if not db_exercise_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise plan not found or not assigned by this trainer in this branch."
        )

    if exercise_plan_update.user_id != db_exercise_plan.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User of an exercise plan cannot be changed after assignment."
        )

    db_exercise_plan.title = exercise_plan_update.title
    db_exercise_plan.description = exercise_plan_update.description
    db_exercise_plan.expiry_date = exercise_plan_update.expiry_date

    db.commit()
    db.refresh(db_exercise_plan)

    user = db.query(models.User).filter(models.User.id == db_exercise_plan.user_id).first()
    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == db_exercise_plan.assigned_by_trainer_id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=db_exercise_plan.assigned_by_trainer_id, name="Unknown Trainer", specialization=[], rating=0.0, experience=0, phone="", email="", availability=None, branch_name=None
        )

    return schemas.ExercisePlanResponse(
        id=db_exercise_plan.id,
        user_id=db_exercise_plan.user_id,
        assigned_by_trainer_id=db_exercise_plan.assigned_by_trainer_id,
        title=db_exercise_plan.title,
        description=db_exercise_plan.description,
        assigned_date=db_exercise_plan.assigned_date,
        expiry_date=db_exercise_plan.expiry_date,
        branch_name=db_exercise_plan.branch_name,
        user=schemas.UserResponse.from_orm(user),
        assigned_by_trainer=trainer_schema
    )

@router.delete("/exercise-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise_plan(
    plan_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer)
):
    """
    Allows a trainer to delete an exercise plan they have assigned.
    Ensures the plan belongs to the current trainer and their branch.
    """
    db_exercise_plan = db.query(models.ExercisePlan).filter(
        models.ExercisePlan.id == plan_id,
        models.ExercisePlan.assigned_by_trainer_id == current_trainer.id,
        models.ExercisePlan.branch_name == current_trainer.branch
    ).first()

    if not db_exercise_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise plan not found or not assigned by this trainer in this branch."
        )

    db.delete(db_exercise_plan)
    db.commit()
    return {"message": "Exercise plan deleted successfully"}

@router.get("/exercise-plans", response_model=List[schemas.ExercisePlanResponse])
def get_trainer_exercise_plans(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
    user_id: Optional[int] = None
):
    """
    Allows a trainer to view exercise plans assigned by them, optionally filtered by user.
    """
    query = db.query(models.ExercisePlan).filter(
        models.ExercisePlan.assigned_by_trainer_id == current_trainer.id,
        models.ExercisePlan.branch_name == current_trainer.branch
    ).join(models.User, models.ExercisePlan.user_id == models.User.id)

    if user_id:
        query = query.filter(models.ExercisePlan.user_id == user_id)

    exercise_plans = query.all()

    result = []
    trainer_data = db.query(models.Trainer).filter(models.Trainer.id == current_trainer.id).first()
    if trainer_data:
        trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
        trainer_schema = schemas.TrainerResponse.from_orm(trainer_data)
    else:
        trainer_schema = schemas.TrainerResponse(
            id=current_trainer.id,
            name=current_trainer.name,
            specialization=[],
            rating=0.0, experience=0, phone="", email="", availability=None, branch_name=current_trainer.branch
        )

    for ep in exercise_plans:
        ep_dict = ep.__dict__.copy()
        ep_dict['user'] = schemas.UserResponse.from_orm(db.query(models.User).filter(models.User.id == ep.user_id).first())
        ep_dict['assigned_by_trainer'] = trainer_schema
        result.append(schemas.ExercisePlanResponse(**ep_dict))
    return result

@router.post("/add-trainer", response_model=schemas.TrainerResponse)
def add_trainer(
    trainer: schemas.TrainerCreate,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin),
):
    existing_trainer = db.query(models.Trainer).filter(models.Trainer.email == trainer.email).first()
    if existing_trainer:
        raise HTTPException(status_code=400, detail="Trainer with this email already exists.")

    hashed_password = utils.get_password_hash(trainer.password)
    
    is_approved_by_superadmin = False
    if current_admin.role == "superadmin" and trainer.revenue_config:
        is_approved_by_superadmin = True

    new_trainer = models.Trainer(
        name=trainer.name,
        specialization=",".join(trainer.specialization),
        rating=trainer.rating,
        experience=trainer.experience,
        phone=trainer.phone,
        email=trainer.email,
        password=hashed_password,
        availability=trainer.availability,
        branch_name=current_admin.branch if current_admin.role == "admin" else trainer.branch_name,
        revenue_config=trainer.revenue_config,
        is_approved_by_superadmin=is_approved_by_superadmin
    )

    db.add(new_trainer)
    db.commit()
    db.refresh(new_trainer)
    new_trainer.specialization = trainer.specialization
    return new_trainer

@router.get("/", response_model=list[schemas.TrainerResponse])
def get_trainers(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Allows all authenticated users to view trainers.
    Admins will see trainers in their branch. Superadmins will see all trainers.
    """
    query = db.query(models.Trainer)

    if current_user.role == "admin":
        if not current_user.branch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin's branch not specified."
            )
        query = query.filter(models.Trainer.branch_name == current_user.branch)
    elif current_user.role == "superadmin":
        pass
    else:
        if current_user.branch:
            query = query.filter(models.Trainer.branch_name == current_user.branch)


    trainers = query.all()
    for t in trainers:
        t.specialization = t.specialization.split(",") if isinstance(t.specialization, str) and t.specialization else []
    return trainers

@router.get("/{trainer_id}", response_model=schemas.TrainerResponse)
def get_trainer_by_id(trainer_id: int, db: Session = Depends(database.get_db)):
    """
    Allows fetching a single trainer's profile by ID. Accessible to all authenticated users.
    """
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    trainer.specialization = trainer.specialization.split(",") if isinstance(trainer.specialization, str) and trainer.specialization else []
    return trainer

@router.put("/{trainer_id}", response_model=schemas.TrainerResponse)
def update_trainer(
    trainer_id: int, 
    trainer: schemas.TrainerCreate, 
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_superadmin),
):
    db_trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    if trainer.revenue_config and trainer.revenue_config != db_trainer.revenue_config:
        if current_admin.role == "superadmin":
            db_trainer.is_approved_by_superadmin = True
        else:
            db_trainer.is_approved_by_superadmin = False

    db_trainer.name = trainer.name
    db_trainer.specialization = ",".join(trainer.specialization)
    db_trainer.rating = trainer.rating
    db_trainer.experience = trainer.experience
    db_trainer.phone = trainer.phone
    db_trainer.email = trainer.email
    
    if trainer.password:
        db_trainer.password = utils.get_password_hash(trainer.password)

    db_trainer.availability = trainer.availability
    if current_admin.role == "superadmin" and trainer.branch_name:
         db_trainer.branch_name = trainer.branch_name
    elif current_admin.role == "admin":
        db_trainer.branch_name = current_admin.branch

    db_trainer.revenue_config = trainer.revenue_config

    db.commit()
    db.refresh(db_trainer)
    db_trainer.specialization = trainer.specialization
    return db_trainer

@router.delete("/{trainer_id}")
def delete_trainer(trainer_id: int, db: Session = Depends(database.get_db)):
    db_trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    db.delete(db_trainer)
    db.commit()
    return {"message": "Trainer deleted successfully"}

@router.put("/revenue/{trainer_id}", response_model=schemas.TrainerResponse)
def set_trainer_revenue(
    trainer_id: int,
    revenue_update: schemas.TrainerRevenueUpdate,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin),
):
    db_trainer = db.query(models.Trainer).filter(
        models.Trainer.id == trainer_id,
        models.Trainer.branch_name == current_admin.branch
    ).first()

    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found in your branch.")

    db_trainer.revenue_config = revenue_update.revenue_config
    db_trainer.is_approved_by_superadmin = False

    # Create a notification for the superadmin
    superadmin_user = db.query(models.User).filter(models.User.role == "superadmin").first()
    if superadmin_user:
        notification_message = f"Revenue configuration for trainer {db_trainer.name} is awaiting your approval."
        new_notification = models.UserNotification(
            user_id=superadmin_user.id,
            message=notification_message,
            notification_type="revenue_approval_pending"
        )
        db.add(new_notification)

    db.commit()
    db.refresh(db_trainer)
    db_trainer.specialization = db_trainer.specialization.split(",") if isinstance(db_trainer.specialization, str) and db_trainer.specialization else []
    return db_trainer

@router.put("/revenue/{trainer_id}/approve", response_model=schemas.TrainerResponse)
def approve_trainer_revenue(
    trainer_id: int,
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin),
):
    db_trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()

    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    if db_trainer.is_approved_by_superadmin:
        raise HTTPException(status_code=400, detail="Revenue configuration is already approved.")
    
    db_trainer.is_approved_by_superadmin = True

    # Find the admin of the trainer's branch
    admin_user = db.query(models.User).filter(
        models.User.role == "admin",
        models.User.branch == db_trainer.branch_name
    ).first()

    # Create a notification for the admin
    if admin_user:
        notification_message = f"Superadmin has approved the revenue configuration for trainer {db_trainer.name}."
        new_notification = models.UserNotification(
            user_id=admin_user.id,
            message=notification_message,
            notification_type="revenue_approval_complete"
        )
        db.add(new_notification)

    db.commit()
    db.refresh(db_trainer)
    db_trainer.specialization = db_trainer.specialization.split(",") if isinstance(db_trainer.specialization, str) and db_trainer.specialization else []
    return db_trainer
