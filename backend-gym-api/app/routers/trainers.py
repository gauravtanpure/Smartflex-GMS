from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, time # Import date and time
from .. import models, schemas, database, utils

router = APIRouter(prefix="/trainers", tags=["Trainers"])

# Dependency to get current authenticated user/trainer
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

# Dependency for trainer role check
def get_current_trainer(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only trainers can access this.",
        )
    return current_user

@router.get("/", response_model=list[schemas.TrainerResponse])
def get_trainers(db: Session = Depends(database.get_db)):
    trainers = db.query(models.Trainer).all()
    for t in trainers:
        t.specialization = t.specialization.split(",")
    return trainers


@router.post("/add-trainer", response_model=schemas.TrainerResponse)
def add_trainer(trainer: schemas.TrainerCreate, db: Session = Depends(database.get_db)):
    existing_trainer = db.query(models.Trainer).filter(models.Trainer.email == trainer.email).first()
    if existing_trainer:
        raise HTTPException(status_code=400, detail="Trainer with this email already exists.")

    hashed_password = utils.get_password_hash(trainer.password)  # ✅ Hash password before storing

    new_trainer = models.Trainer(
        name=trainer.name,
        specialization=",".join(trainer.specialization),
        rating=trainer.rating,
        experience=trainer.experience,
        phone=trainer.phone,
        email=trainer.email,
        password=hashed_password,  # ✅ Store hashed password
        availability=trainer.availability,
        branch_name=trainer.branch_name,
    )

    db.add(new_trainer)
    db.commit()
    db.refresh(new_trainer)
    new_trainer.specialization = trainer.specialization
    return new_trainer


@router.put("/{trainer_id}", response_model=schemas.TrainerResponse)
def update_trainer(trainer_id: int, trainer: schemas.TrainerCreate, db: Session = Depends(database.get_db)):
    db_trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    db_trainer.name = trainer.name
    db_trainer.specialization = ",".join(trainer.specialization)
    db_trainer.rating = trainer.rating
    db_trainer.experience = trainer.experience
    db_trainer.phone = trainer.phone
    db_trainer.email = trainer.email
    db_trainer.password = utils.get_password_hash(trainer.password)  # ✅ Update password (hashed)
    db_trainer.availability = trainer.availability
    db_trainer.branch_name = trainer.branch_name

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

# --- New Endpoints for Session Management (Trainer Role Only) ---

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
        branch_name=current_trainer.branch, # Assign session to trainer's branch
        max_capacity=session.max_capacity,
        description=session.description
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

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

@router.put("/sessions/{session_id}", response_model=schemas.SessionScheduleResponse)
def update_session(
    session_id: int,
    session_update: schemas.SessionScheduleCreate, # Use create schema for update payload
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

# --- New Endpoints for Session Attendance Management ---

@router.post("/sessions/{session_id}/attendance", response_model=schemas.SessionAttendanceResponse)
def mark_session_attendance(
    session_id: int,
    attendance_data: schemas.SessionAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to mark attendance for a user in a specific session.
    Ensures the session belongs to the trainer and the user belongs to the trainer's branch.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id,
        models.SessionSchedule.trainer_id == current_trainer.id,
        models.SessionSchedule.branch_name == current_trainer.branch
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found, not created by this trainer, or not in trainer's branch."
        )

    # Verify the user exists and belongs to the trainer's branch
    user = db.query(models.User).filter(
        models.User.id == attendance_data.user_id,
        models.User.branch == current_trainer.branch
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in trainer's branch or does not exist."
        )

    # Check if attendance for this user and session on this date already exists
    existing_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.user_id == attendance_data.user_id,
        models.SessionAttendance.attendance_date == attendance_data.attendance_date
    ).first()

    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance for this user in this session on this date already marked. Use PUT to update."
        )

    new_attendance = models.SessionAttendance(
        session_id=session_id,
        user_id=attendance_data.user_id,
        status=attendance_data.status,
        attendance_date=attendance_data.attendance_date
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    # Eagerly load the user relationship for the response
    new_attendance.user = user
    return new_attendance

@router.get("/sessions/{session_id}/attendance", response_model=List[schemas.SessionAttendanceResponse])
def get_session_attendance(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
    attendance_date: Optional[date] = None,
):
    """
    Allows a trainer to view attendance records for a specific session.
    Ensures the session belongs to the trainer.
    Optionally filter by attendance date.
    """
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id,
        models.SessionSchedule.trainer_id == current_trainer.id,
        models.SessionSchedule.branch_name == current_trainer.branch
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found, not created by this trainer, or not in trainer's branch."
        )

    query = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id
    ).join(models.User, models.SessionAttendance.user_id == models.User.id) # Join with User to get user details

    if attendance_date:
        query = query.filter(models.SessionAttendance.attendance_date == attendance_date)

    attendance_records = query.all()

    # Manually populate the user field for each attendance record
    for record in attendance_records:
        record.user = db.query(models.User).filter(models.User.id == record.user_id).first()

    return attendance_records

@router.put("/sessions/attendance/{attendance_id}", response_model=schemas.SessionAttendanceResponse)
def update_session_attendance(
    attendance_id: int,
    attendance_data: schemas.SessionAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to update an existing session attendance record.
    Ensures the session associated with the attendance belongs to the trainer.
    """
    db_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.id == attendance_id
    ).first()

    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found."
        )

    # Verify the session associated with this attendance record belongs to the current trainer
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == db_attendance.session_id,
        models.SessionSchedule.trainer_id == current_trainer.id,
        models.SessionSchedule.branch_name == current_trainer.branch
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this attendance record (session not found or not yours)."
        )

    # If user_id is being changed, verify the new user belongs to the trainer's branch
    if attendance_data.user_id != db_attendance.user_id:
        user = db.query(models.User).filter(
            models.User.id == attendance_data.user_id,
            models.User.branch == current_trainer.branch
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New user_id not found in trainer's branch or does not exist."
            )
        db_attendance.user_id = attendance_data.user_id

    db_attendance.status = attendance_data.status
    db_attendance.attendance_date = attendance_data.attendance_date

    db.commit()
    db.refresh(db_attendance)
    # Eagerly load the user relationship for the response
    db_attendance.user = db.query(models.User).filter(models.User.id == db_attendance.user_id).first()
    return db_attendance

@router.delete("/sessions/attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session_attendance(
    attendance_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to delete a session attendance record.
    Ensures the session associated with the attendance belongs to the trainer.
    """
    db_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.id == attendance_id
    ).first()

    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found."
        )

    # Verify the session associated with this attendance record belongs to the current trainer
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == db_attendance.session_id,
        models.SessionSchedule.trainer_id == current_trainer.id,
        models.SessionSchedule.branch_name == current_trainer.branch
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this attendance record (session not found or not yours)."
        )

    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}
