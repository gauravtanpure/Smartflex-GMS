# backend/routers/fee_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database, utils
from datetime import date # Import date for filtering

router = APIRouter(prefix="/fees", tags=["Fee Management"])

def get_current_admin(current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Only branch admins can perform this action.")
    return current_user

@router.post("/", response_model=schemas.FeeAssignmentResponse)
def assign_fee(
    fee: schemas.FeeAssignmentCreate,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == fee.user_id).first()
    if not user or (current_admin.role == "admin" and user.branch != current_admin.branch): # Admins can only assign to their branch users
        raise HTTPException(status_code=404, detail="User not found in your branch or you don't have permission to assign fees to this user.")

    new_fee = models.FeeAssignment(
        user_id=fee.user_id,
        assigned_by_user_id=current_admin.id,
        branch_name=user.branch, # Use the user's branch for the fee assignment
        fee_type=fee.fee_type,
        amount=fee.amount,
        due_date=fee.due_date
    )
    db.add(new_fee)

    # Create notification
    notification = models.UserNotification(
        user_id=fee.user_id,
        message=f"A new fee of ₹{fee.amount} for '{fee.fee_type}' is due by {fee.due_date}.",
        notification_type="fee_assignment"
    )
    db.add(notification)

    db.commit()
    db.refresh(new_fee)

    # FIX: Manually construct the response to include the nested user object
    new_fee_dict = new_fee.__dict__.copy()
    new_fee_dict['user'] = schemas.UserResponse.from_orm(user)
    
    return schemas.FeeAssignmentResponse(**new_fee_dict)

# NEW ENDPOINT: Get all fee assignments for a branch (admin/superadmin only)
@router.get("/branch", response_model=List[schemas.FeeAssignmentResponse])
def get_branch_fees(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin), # Only admins/superadmins can access this
    user_id: Optional[int] = None, # Optional filter by user ID
    is_paid: Optional[bool] = None # Optional filter by paid status
):
    """
    Allows branch admins and superadmins to view fee assignments for their branch.
    Superadmins can see fees from all branches.
    """
    query = db.query(models.FeeAssignment).join(models.User, models.FeeAssignment.user_id == models.User.id) # Join with User model

    if current_admin.role == "admin":
        if not current_admin.branch:
            raise HTTPException(status_code=400, detail="Admin's branch not specified.")
        query = query.filter(models.FeeAssignment.branch_name == current_admin.branch)
    # Superadmins can view all fees, no branch filter needed for them

    if user_id is not None:
        query = query.filter(models.FeeAssignment.user_id == user_id)
    if is_paid is not None:
        query = query.filter(models.FeeAssignment.is_paid == is_paid)

    fees = query.all()

    # Manually populate the 'user' field in each FeeAssignmentResponse
    # This is necessary because SQLAlchemy's .all() won't automatically load relationships not explicitly defined in the query
    # and we want to return the full UserResponse schema for the 'user' field.
    result = []
    for fee_assignment in fees:
        user_data = db.query(models.User).filter(models.User.id == fee_assignment.user_id).first()
        if user_data:
            fee_assignment_dict = fee_assignment.__dict__.copy() # Ensure we're working with a copy
            fee_assignment_dict['user'] = schemas.UserResponse(
                id=user_data.id,
                name=user_data.name,
                email=user_data.email,
                phone=user_data.phone,
                role=user_data.role,
                branch=user_data.branch
            )
            result.append(schemas.FeeAssignmentResponse(**fee_assignment_dict))
        else:
            result.append(schemas.FeeAssignmentResponse.from_orm(fee_assignment)) # Fallback if user not found (shouldn't happen with FK)
    return result

# NEW ENDPOINT: Update fee status (admin/superadmin only)
@router.put("/{fee_id}/status", response_model=schemas.FeeAssignmentResponse)
def update_fee_status(
    fee_id: int,
    update_data: schemas.FeeAssignmentUpdate, # Expects a FeeAssignmentUpdate schema
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin)
):
    """
    Allows branch admins and superadmins to update the paid status of a fee.
    Ensures the fee belongs to the admin's branch if the user is a regular admin.
    """
    db_fee = db.query(models.FeeAssignment).filter(models.FeeAssignment.id == fee_id).first()

    if not db_fee:
        raise HTTPException(status_code=404, detail="Fee assignment not found.")

    if current_admin.role == "admin" and db_fee.branch_name != current_admin.branch:
        raise HTTPException(status_code=403, detail="Not authorized to update fees outside your branch.")

    # Only allow updating is_paid status and potentially amount or due_date
    if update_data.is_paid is not None:
        db_fee.is_paid = update_data.is_paid
    if update_data.amount is not None:
        db_fee.amount = update_data.amount
    if update_data.due_date is not None:
        db_fee.due_date = update_data.due_date

    db.commit()
    db.refresh(db_fee)
    
    # Manually populate the 'user' field before returning
    user_data = db.query(models.User).filter(models.User.id == db_fee.user_id).first()
    if user_data:
        db_fee_dict = db_fee.__dict__.copy()
        db_fee_dict['user'] = schemas.UserResponse(
            id=user_data.id,
            name=user_data.name,
            email=user_data.email,
            phone=user_data.phone,
            role=user_data.role,
            branch=user_data.branch
        )
        return schemas.FeeAssignmentResponse(**db_fee_dict)
    else:
        # Fallback if user not found (should not happen if FKs are respected)
        return schemas.FeeAssignmentResponse.from_orm(db_fee)


@router.get("/my-fees", response_model=List[schemas.UserFeesResponse])
def get_my_fees(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    fees = db.query(models.FeeAssignment).filter(models.FeeAssignment.user_id == current_user.id).all()
    result = []
    for f in fees:
        assigned_by = db.query(models.User).filter(models.User.id == f.assigned_by_user_id).first()
        result.append(schemas.UserFeesResponse(
            id=f.id,
            fee_type=f.fee_type,
            amount=f.amount,
            due_date=f.due_date,
            is_paid=f.is_paid,
            assigned_by_name=assigned_by.name if assigned_by else "Unknown",
            branch_name=f.branch_name
        ))
    return result

@router.get("/notifications", response_model=List[schemas.UserNotificationResponse])
def get_user_notifications(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    return db.query(models.UserNotification).filter(models.UserNotification.user_id == current_user.id).order_by(models.UserNotification.created_at.desc()).all()

@router.put("/notifications/mark-all-read", response_model=List[schemas.UserNotificationResponse])
def mark_all_notifications_read(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    """
    Marks all unread notifications for the current user as read.
    """
    notifications_to_update = db.query(models.UserNotification).filter(
        models.UserNotification.user_id == current_user.id,
        models.UserNotification.is_read == False
    ).all()

    for notif in notifications_to_update:
        notif.is_read = True

    db.commit()

    # Refresh all notifications to return the updated list
    return db.query(models.UserNotification).filter(models.UserNotification.user_id == current_user.id).order_by(models.UserNotification.created_at.desc()).all()


@router.put("/notifications/{notification_id}", response_model=schemas.UserNotificationResponse)
def mark_notification_read(
    notification_id: int,
    update_data: schemas.UserNotificationUpdate,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    notif = db.query(models.UserNotification).filter(
        models.UserNotification.id == notification_id,
        models.UserNotification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = update_data.is_read
    db.commit()
    db.refresh(notif)
    return notif