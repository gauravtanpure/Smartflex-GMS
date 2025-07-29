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

# IMPORTANT: Put specific routes BEFORE parameterized routes to avoid conflicts

# --- Session Management Endpoints (Trainer Role Only) - PUT THESE FIRST ---

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

# Public endpoint to get all sessions (for members to book)
@router.get("/public-sessions", response_model=List[schemas.SessionScheduleResponse])
def get_public_sessions(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user), # Any authenticated user
):
    """
    Allows any authenticated user to view all available session schedules.
    """
    sessions = db.query(models.SessionSchedule).all()
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

# --- Session Attendance Management ---

@router.post("/sessions/{session_id}/attendance", response_model=schemas.SessionAttendanceResponse)
def mark_session_attendance(
    session_id: int,
    attendance_data: schemas.SessionAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user), # Changed to allow any authenticated user
):
    """
    Allows users to book sessions (mark their own attendance) and trainers to mark attendance for users.
    For regular users: they can only mark their own attendance.
    For trainers: they can mark attendance for any user in their branch.
    """
    # Get the session details
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    # If current user is a trainer
    if current_user.role == "trainer":
        # Verify the session belongs to the trainer and user belongs to trainer's branch
        if db_session.trainer_id != current_user.id or db_session.branch_name != current_user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found, not created by this trainer, or not in trainer's branch."
            )
        
        # Verify the user exists and belongs to the trainer's branch
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
        # For regular users, they can only mark their own attendance
        if attendance_data.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark your own attendance."
            )
        
        # Verify the user exists
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

    # Check if attendance for this user and session on this date already exists
    existing_attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.user_id == attendance_data.user_id,
        models.SessionAttendance.attendance_date == attendance_data.attendance_date
    ).first()

    if existing_attendance:
        # If attendance exists, update it instead of creating new
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
    # Eagerly load the user relationship for the response
    new_attendance.user = user
    return new_attendance

@router.get("/sessions/{session_id}/attendance", response_model=List[schemas.SessionAttendanceResponse])
def get_session_attendance(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user), # Changed to allow any authenticated user
    user_id: Optional[int] = None, # Added optional user_id for specific lookup
    attendance_date: Optional[date] = None,
):
    """
    Allows trainers to view attendance records for their sessions.
    Allows regular users to view their own attendance records for any session.
    """
    # Get the session details
    db_session = db.query(models.SessionSchedule).filter(
        models.SessionSchedule.id == session_id
    ).first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    if current_user.role == "trainer":
        # Verify the session belongs to the trainer
        if db_session.trainer_id != current_user.id or db_session.branch_name != current_user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found, not created by this trainer, or not in trainer's branch."
            )
        
        # Trainers can see all attendance for their sessions
        query = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session_id
        ).join(models.User, models.SessionAttendance.user_id == models.User.id)
        
        if user_id:
            query = query.filter(models.SessionAttendance.user_id == user_id)
        if attendance_date:
            query = query.filter(models.SessionAttendance.attendance_date == attendance_date)
    else:
        # Regular users can only see their own attendance
        query = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session_id,
            models.SessionAttendance.user_id == current_user.id
        ).join(models.User, models.SessionAttendance.user_id == models.User.id)
        
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
    current_user: schemas.UserResponse = Depends(get_current_active_user), # Changed to allow any authenticated user
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
        # Verify the session associated with this attendance record belongs to the current trainer
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

        # If user_id is being changed, verify the new user belongs to the trainer's branch
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
        # Regular users can only update their own attendance
        if db_attendance.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own attendance records."
            )
        
        # Don't allow regular users to change the user_id
        if attendance_data.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot change the user_id for attendance records."
            )

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
    current_user: schemas.UserResponse = Depends(get_current_active_user), # Changed to allow any authenticated user
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
        # Verify the session associated with this attendance record belongs to the current trainer
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
        # Regular users can only delete their own attendance
        if db_attendance.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own session bookings."
            )

    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}

# --- Trainer CRUD Endpoints (PUT THESE AFTER SESSION ROUTES) ---

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

# GET all trainers - this should come before the specific trainer route
@router.get("/", response_model=list[schemas.TrainerResponse])
def get_trainers(db: Session = Depends(database.get_db)):
    trainers = db.query(models.Trainer).all()
    for t in trainers:
        t.specialization = t.specialization.split(",")
    return trainers

# GET single trainer by ID - MUST come after other specific routes
@router.get("/{trainer_id}", response_model=schemas.TrainerResponse)
def get_trainer_by_id(trainer_id: int, db: Session = Depends(database.get_db)):
    """
    Allows fetching a single trainer's profile by ID. Accessible to all authenticated users.
    """
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    trainer.specialization = trainer.specialization.split(",") # Ensure specialization is a list
    return trainer

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