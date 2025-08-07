from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from .. import models, schemas, database, utils
from app.schemas import BulkAttendanceEntry

router = APIRouter(prefix="/users", tags=["Users"])


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


def get_current_admin_or_trainer(
    current_user: schemas.UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "superadmin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only branch admins, superadmins, or trainers can access this.",
        )
    return current_user


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
        gender=user.gender,
        branch=user.branch
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/branch-enrollments", response_model=List[schemas.EnrolledUserInfo])
def get_branch_enrollments(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin_or_trainer)
):
    if not current_admin.branch:
        raise HTTPException(status_code=400, detail="Branch not specified for the current user.")

    users_data = (
        db.query(models.User, models.Member, models.FeeAssignment)
        .outerjoin(models.Member, models.User.id == models.Member.user_id)
        .outerjoin(models.FeeAssignment, models.User.id == models.FeeAssignment.user_id)
        .filter(models.User.branch == current_admin.branch)
        .order_by(models.FeeAssignment.created_at.desc())
        .all()
    )

    result = []
    processed_users = set()

    for user, member, fee_assignment in users_data:
        if user.id in processed_users:
            continue

        age = None
        gender = user.gender
        role = user.role

        if member and member.date_of_birth:
            try:
                birth_date = datetime.strptime(member.date_of_birth, "%Y-%m-%d").date()
                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            except ValueError:
                age = None

        opted_plan = fee_assignment.fee_type if fee_assignment else None
        date_joined = fee_assignment.created_at if fee_assignment else None

        status_text = "Pending Enrollment"
        if fee_assignment:
            status_text = "Active" if fee_assignment.is_paid else "Unpaid Fees"

        user_data_for_schema = {
            "user_id": user.id,
            "name": user.name,
            "date_joined": date_joined,
            "opted_plan": opted_plan,
            "status": status_text,
            "gender": gender,
            "age": age,
            "role": role,
        }

        result.append(schemas.EnrolledUserInfo(**user_data_for_schema))
        processed_users.add(user.id)

    return result


@router.get("/branch-users", response_model=List[schemas.UserResponse])
def get_users_by_branch(
    db: Session = Depends(database.get_db),
    current_user_role: schemas.UserResponse = Depends(get_current_admin_or_trainer),
):
    user_branch = current_user_role.branch
    if not user_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User's branch not specified.",
        )

    users = db.query(models.User).filter(models.User.branch == user_branch).all()
    return users


@router.get("/branch-attendance", response_model=List[schemas.UserAttendanceResponse])
def get_attendance_by_branch(
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
    attendance_date: Optional[date] = None,
):
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer's branch not specified.",
        )

    query = db.query(models.UserAttendance).filter(models.UserAttendance.branch == trainer_branch)
    if attendance_date:
        query = query.filter(models.UserAttendance.date == attendance_date)

    attendance_records = query.all()
    return attendance_records


@router.post("/manage-attendance", response_model=schemas.UserAttendanceResponse)
def create_attendance_record(
    attendance_data: schemas.UserAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(status_code=400, detail="Trainer's branch not specified.")

    user = db.query(models.User).filter(
        models.User.id == attendance_data.user_id,
        models.User.branch == trainer_branch
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found in trainer's branch or does not exist.")

    new_attendance = models.UserAttendance(
        user_id=attendance_data.user_id,
        date=attendance_data.date,
        status=attendance_data.status,
        branch=trainer_branch
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance


@router.put("/manage-attendance/{attendance_id}", response_model=schemas.UserAttendanceResponse)
def update_attendance_record(
    attendance_id: int,
    attendance_data: schemas.UserAttendanceCreate,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(status_code=400, detail="Trainer's branch not specified.")

    db_attendance = db.query(models.UserAttendance).filter(
        models.UserAttendance.id == attendance_id,
        models.UserAttendance.branch == trainer_branch
    ).first()

    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found or not in trainer's branch.")

    if attendance_data.user_id != db_attendance.user_id:
        user = db.query(models.User).filter(
            models.User.id == attendance_data.user_id,
            models.User.branch == trainer_branch
        ).first()
        if not user:
            raise HTTPException(status_code=404, detail="New user_id not found in trainer's branch or does not exist.")

    db_attendance.user_id = attendance_data.user_id
    db_attendance.date = attendance_data.date
    db_attendance.status = attendance_data.status

    db.commit()
    db.refresh(db_attendance)
    return db_attendance


@router.delete("/manage-attendance/{attendance_id}")
def delete_attendance_record(
    attendance_id: int,
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    trainer_branch = current_trainer.branch
    if not trainer_branch:
        raise HTTPException(status_code=400, detail="Trainer's branch not specified.")

    db_attendance = db.query(models.UserAttendance).filter(
        models.UserAttendance.id == attendance_id,
        models.UserAttendance.branch == trainer_branch
    ).first()

    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found or not in trainer's branch.")

    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}


@router.get("/my-attendance", response_model=List[schemas.UserAttendanceResponse])
def get_my_attendance(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    start_date: Optional[date] = None,
    end_date: Optional[Optional[date]] = None,
):
    if not current_user.id:
        raise HTTPException(status_code=400, detail="User ID not available for current user.")

    query = db.query(models.UserAttendance).filter(models.UserAttendance.user_id == current_user.id)

    if start_date:
        query = query.filter(models.UserAttendance.date >= start_date)
    if end_date:
        query = query.filter(models.UserAttendance.date <= end_date)

    attendance_records = query.order_by(models.UserAttendance.date.desc()).all()
    return attendance_records


@router.get("/my-diet-plans", response_model=List[schemas.DietPlanResponse])
def get_my_diet_plans(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user)
):
    diet_plans = db.query(models.DietPlan).filter(models.DietPlan.user_id == current_user.id).all()

    result = []
    for dp in diet_plans:
        dp_dict = dp.__dict__.copy()

        user_data = db.query(models.User).filter(models.User.id == dp.user_id).first()
        dp_dict['user'] = schemas.UserResponse.from_orm(user_data) if user_data else schemas.UserResponse(id=dp.user_id, name="Unknown User", email="", phone="", role="member", branch=None, gender=None)

        trainer_data = db.query(models.Trainer).filter(models.Trainer.id == dp.assigned_by_trainer_id).first()
        if trainer_data:
            trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
            dp_dict['assigned_by_trainer'] = schemas.TrainerResponse.from_orm(trainer_data)
        else:
            dp_dict['assigned_by_trainer'] = schemas.TrainerResponse(id=dp.assigned_by_trainer_id, name="Unknown Trainer", specialization=[], rating=0.0, experience=0, phone="", email="", availability=None, branch_name=None)

        result.append(schemas.DietPlanResponse(**dp_dict))
    return result


@router.get("/my-exercise-plans", response_model=List[schemas.ExercisePlanResponse])
def get_my_exercise_plans(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user)
):
    exercise_plans = db.query(models.ExercisePlan).filter(models.ExercisePlan.user_id == current_user.id).all()

    result = []
    for ep in exercise_plans:
        ep_dict = ep.__dict__.copy()

        user_data = db.query(models.User).filter(models.User.id == ep.user_id).first()
        ep_dict['user'] = schemas.UserResponse.from_orm(user_data) if user_data else schemas.UserResponse(id=ep.user_id, name="Unknown User", email="", phone="", role="member", branch=None, gender=None)

        trainer_data = db.query(models.Trainer).filter(models.Trainer.id == ep.assigned_by_trainer_id).first()
        if trainer_data:
            trainer_data.specialization = trainer_data.specialization.split(",") if isinstance(trainer_data.specialization, str) and trainer_data.specialization else []
            ep_dict['assigned_by_trainer'] = schemas.TrainerResponse.from_orm(trainer_data)
        else:
            ep_dict['assigned_by_trainer'] = schemas.TrainerResponse(id=ep.assigned_by_trainer_id, name="Unknown Trainer", specialization=[], rating=0.0, experience=0, phone="", email="", availability=None, branch_name=None)

        result.append(schemas.ExercisePlanResponse(**ep_dict))
    return result


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.name is not None:
        db_user.name = user.name
    if user.email is not None:
        db_user.email = user.email
    if user.phone is not None:
        db_user.phone = user.phone

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.post("/profile-complete")
def save_profile_data(member: schemas.MemberCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Member).filter(models.Member.user_id == member.user_id).first()
    if existing:
        # If profile exists, update it instead of raising an error
        update_data = member.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return {"message": "Profile data updated successfully"}

    new_member = models.Member(**member.model_dump())
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Profile data saved successfully"}


@router.get("/member/{user_id}")
def get_member_profile(user_id: int, db: Session = Depends(database.get_db)):
    member = db.query(models.Member).filter(models.Member.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    return member

@router.post("/bulk-attendance", status_code=201)
def bulk_attendance(
    entries: List[BulkAttendanceEntry],
    db: Session = Depends(database.get_db),
    current_trainer: schemas.UserResponse = Depends(get_current_trainer),
):
    branch = current_trainer.branch
    if not branch:
        raise HTTPException(status_code=400, detail="Trainer's branch not specified.")

    for entry in entries:
        user = db.query(models.User).filter(
            models.User.id == entry.user_id,
            models.User.branch == branch
        ).first()

        if not user:
            continue  # Skip invalid users

        already_marked = db.query(models.UserAttendance).filter(
            models.UserAttendance.user_id == entry.user_id,
            models.UserAttendance.date == entry.date,
            models.UserAttendance.branch == branch
        ).first()

        if already_marked:
            already_marked.status = entry.status
        else:
            new_record = models.UserAttendance(
                user_id=entry.user_id,
                date=entry.date,
                status=entry.status,
                branch=branch
            )
            db.add(new_record)

    db.commit()
    return {"message": "Attendance submitted successfully"}
