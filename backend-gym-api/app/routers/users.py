# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date # Keep this import if you use it for attendance_date
from .. import models, schemas, database, utils

router = APIRouter(prefix="/users", tags=["Users"])

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

# --- General User Endpoints (most specific first, then more general) ---

# Endpoint to create a new user (including admin/trainer roles)
@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = utils.get_password_hash(user.password)

    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        phone=user.phone,
        role=user.role,
        branch=user.branch
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Trainer Specific Endpoints (must come before general /{user_id} routes) ---

@router.get("/branch-users", response_model=List[schemas.UserResponse])
def get_users_by_branch(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer), # Use the trainer dependency
):
    """
    Allows a trainer to see all users in their assigned branch.
    """
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    users = db.query(models.User).filter(models.User.branch == trainer_branch).all()
    return users

@router.get("/branch-attendance", response_model=List[schemas.UserAttendanceResponse]) # Use schemas.UserAttendanceResponse
def get_attendance_by_branch(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
    attendance_date: Optional[date] = None, # Use date type for filtering
):
    """
    Allows a trainer to see attendance records for users in their assigned branch.
    Optionally filter by date.
    """
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    query = db.query(models.UserAttendance).filter(models.UserAttendance.branch == trainer_branch) # Use models.UserAttendance
    if attendance_date:
        query = query.filter(models.UserAttendance.date == attendance_date)

    attendance_records = query.all()
    return attendance_records


@router.post("/manage-attendance", response_model=schemas.UserAttendanceResponse) # Use schemas.UserAttendanceResponse
def create_attendance_record(
    attendance_data: schemas.UserAttendanceCreate, # Use schemas.UserAttendanceCreate
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to create an attendance record for a user in their assigned branch.
    Ensures the user belongs to the trainer's branch.
    """
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    # Verify the user exists and belongs to the trainer's branch
    user = db.query(models.User).filter(
        models.User.id == attendance_data.user_id,
        models.User.branch == trainer_branch
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in trainer's branch or does not exist."
        )

    new_attendance = models.UserAttendance( # Use models.UserAttendance
        user_id=attendance_data.user_id,
        date=attendance_data.date,
        status=attendance_data.status,
        branch=trainer_branch # Assign attendance to the trainer's branch
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.put("/manage-attendance/{attendance_id}", response_model=schemas.UserAttendanceResponse) # Use schemas.UserAttendanceResponse
def update_attendance_record(
    attendance_id: int,
    attendance_data: schemas.UserAttendanceCreate, # Use schemas.UserAttendanceCreate
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to update an attendance record.
    Ensures the attendance record belongs to a user in the trainer's branch.
    """
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    db_attendance = db.query(models.UserAttendance).filter( # Use models.UserAttendance
        models.UserAttendance.id == attendance_id,
        models.UserAttendance.branch == trainer_branch
    ).first()

    if not db_attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found or not in trainer's branch.")

    # Optionally, verify the user_id if it's being changed to ensure it's still within the branch
    if attendance_data.user_id != db_attendance.user_id:
        user = db.query(models.User).filter(
            models.User.id == attendance_data.user_id,
            models.User.branch == trainer_branch
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New user_id not found in trainer's branch or does not exist."
            )

    db_attendance.user_id = attendance_data.user_id
    db_attendance.date = attendance_data.date
    db_attendance.status = attendance_data.status
    # branch remains the same as it's already filtered by trainer's branch

    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.delete("/manage-attendance/{attendance_id}")
def delete_attendance_record(
    attendance_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    """
    Allows a trainer to delete an attendance record.
    Ensures the attendance record belongs to a user in the trainer's branch.
    """
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    db_attendance = db.query(models.UserAttendance).filter( # Use models.UserAttendance
        models.UserAttendance.id == attendance_id,
        models.UserAttendance.branch == trainer_branch
    ).first()

    if not db_attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found or not in trainer's branch.")

    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}

# --- New Endpoint for a user to fetch their own attendance ---
@router.get("/my-attendance", response_model=List[schemas.UserAttendanceResponse])
def get_my_attendance(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """
    Allows any authenticated user to fetch their own attendance records.
    Can be filtered by a date range.
    """
    if not current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not available for current user."
        )

    query = db.query(models.UserAttendance).filter(models.UserAttendance.user_id == current_user.id)

    if start_date:
        query = query.filter(models.UserAttendance.date >= start_date)
    if end_date:
        query = query.filter(models.UserAttendance.date <= end_date)

    # Order by date descending for most recent first
    attendance_records = query.order_by(models.UserAttendance.date.desc()).all()
    return attendance_records


# --- General User Endpoints (more general, should come last) ---

# Endpoint to get all users
@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return users

# Endpoint to get a single user by ID
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Endpoint to update a user by ID
@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.name = user.name
    db_user.email = user.email
    # Only update password if provided and different
    if user.password:
        db_user.password = utils.get_password_hash(user.password)
    db_user.phone = user.phone
    db_user.role = user.role
    db_user.branch = user.branch

    db.commit()
    db.refresh(db_user)
    return db_user

# Endpoint to delete a user by ID
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}
