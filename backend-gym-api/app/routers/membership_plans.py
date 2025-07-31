# backend/routers/membership_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database, utils

router = APIRouter(prefix="/membership-plans", tags=["Membership Plans"])

# Dependency to get current admin (branch admin or superadmin)
def get_current_admin(current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Only branch admins or superadmins can perform this action.")
    return current_user

# Dependency to get current superadmin
def get_current_superadmin(current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only superadmins can perform this action.")
    return current_user

@router.post("/", response_model=schemas.MembershipPlanResponse)
def create_membership_plan(
    plan: schemas.MembershipPlanCreate,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin)
):
    """
    Allows branch admins to create membership plans for their branch (unapproved by default),
    and superadmins to create plans for any branch (approved by default if not specified).
    """
    # Check if a plan with the same name already exists in the same branch
    existing_plan_query = db.query(models.MembershipPlan).filter(models.MembershipPlan.plan_name == plan.plan_name)

    is_approved_status = False # Default for admin created plans
    if current_admin.role == "admin":
        if not current_admin.branch:
            raise HTTPException(status_code=400, detail="Admin's branch not specified.")
        # Admins can only create plans for their own branch
        if plan.branch_name and plan.branch_name != current_admin.branch:
             raise HTTPException(status_code=403, detail="Branch admins can only create plans for their own branch.")
        plan.branch_name = current_admin.branch # Ensure plan is assigned to admin's branch
        existing_plan_query = existing_plan_query.filter(models.MembershipPlan.branch_name == current_admin.branch)
        is_approved_status = False # Plans created by admins need approval
    elif current_admin.role == "superadmin":
        # Superadmins can specify a branch or leave it null
        if plan.branch_name:
            existing_plan_query = existing_plan_query.filter(models.MembershipPlan.branch_name == plan.branch_name)
        else:
            existing_plan_query = existing_plan_query.filter(models.MembershipPlan.branch_name.is_(None))
        is_approved_status = True # Plans created by superadmins are approved by default

    if existing_plan_query.first():
        raise HTTPException(status_code=400, detail="Membership plan with this name already exists for this branch.")

    new_plan = models.MembershipPlan(
        plan_name=plan.plan_name,
        description=plan.description,
        price=plan.price,
        duration_months=plan.duration_months,
        branch_name=plan.branch_name,
        is_approved=is_approved_status # Set approval status
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.get("/", response_model=List[schemas.MembershipPlanResponse])
def get_membership_plans(
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user), # Accessible by all authenticated users
    branch_name: Optional[str] = None, # Optional filter for superadmin or public view
    only_unapproved: Optional[bool] = False # ⬅️ NEW FILTER
):
    """
    Allows superadmins to view all/unapproved plans.
    Allows branch admins to view approved plans for their branch.
    Allows other users (members, trainers) to view approved plans relevant to their branch or all public plans.
    """
    query = db.query(models.MembershipPlan)

    if current_user.role == "superadmin":
        if branch_name: # Superadmin can filter by any branch
            query = query.filter(models.MembershipPlan.branch_name == branch_name)
        if only_unapproved: # Superadmin can filter for unapproved plans
            query = query.filter(models.MembershipPlan.is_approved == False)
    elif current_user.role == "admin":
        if not current_user.branch:
            raise HTTPException(status_code=400, detail="Admin's branch not specified.")
        # Admins only see approved plans for their branch
        query = query.filter(
            models.MembershipPlan.branch_name == current_user.branch,
            models.MembershipPlan.is_approved == True
        )
        if only_unapproved: # Admins cannot request unapproved plans directly
            raise HTTPException(status_code=403, detail="Admins can only view approved plans for their branch.")
    else: # Member or Trainer
        # Members and Trainers only see approved plans
        query = query.filter(models.MembershipPlan.is_approved == True)
        if current_user.branch: # If user has a branch, show plans for that branch
            query = query.filter(models.MembershipPlan.branch_name == current_user.branch)
        else: # If user has no branch, show plans not associated with any specific branch
            query = query.filter(models.MembershipPlan.branch_name.is_(None))

    plans = query.all()
    return plans

@router.get("/{plan_id}", response_model=schemas.MembershipPlanResponse)
def get_membership_plan_by_id(
    plan_id: int,
    db: Session = Depends(database.get_db),
    current_user: schemas.UserResponse = Depends(utils.get_current_user)
):
    """
    Allows superadmins to get any plan (approved or unapproved).
    Allows branch admins to get approved plans for their branch.
    Allows other users to get approved plans relevant to their branch.
    """
    plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == plan_id).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    if current_user.role == "superadmin":
        # Superadmin can view any plan
        pass
    elif current_user.role == "admin":
        if not current_user.branch or plan.branch_name != current_user.branch or plan.is_approved == False:
            raise HTTPException(status_code=403, detail="Not authorized to access this plan.")
    else: # Members and Trainers
        if plan.is_approved == False: # Non-admins cannot see unapproved plans
            raise HTTPException(status_code=403, detail="Not authorized to access unapproved plans.")
        if current_user.branch and plan.branch_name != current_user.branch:
            raise HTTPException(status_code=403, detail="Not authorized to access plans from other branches.")
        elif not current_user.branch and plan.branch_name is not None:
             raise HTTPException(status_code=403, detail="Not authorized to access branch-specific plans if you don't have a branch assigned.")

    return plan

@router.put("/{plan_id}", response_model=schemas.MembershipPlanResponse)
def update_membership_plan(
    plan_id: int,
    plan_update: schemas.MembershipPlanUpdate,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin)
):
    """
    Allows branch admins to update plans for their branch (but not approval status).
    Allows superadmins to update any plan, including approval status.
    """
    db_plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == plan_id).first()

    if not db_plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    if current_admin.role == "admin":
        if not current_admin.branch or db_plan.branch_name != current_admin.branch:
            raise HTTPException(status_code=403, detail="Not authorized to update plans outside your branch.")
        if plan_update.is_approved is not None and plan_update.is_approved != db_plan.is_approved:
            raise HTTPException(status_code=403, detail="Branch admins cannot change the approval status of a plan.")

    # Apply updates
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)

    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_membership_plan(
    plan_id: int,
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin)
):
    """
    Allows branch admins to delete plans for their branch, and superadmins to delete any plan.
    """
    db_plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == plan_id).first()

    if not db_plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    if current_admin.role == "admin" and db_plan.branch_name != current_admin.branch:
        raise HTTPException(status_code=403, detail="Not authorized to delete plans outside your branch.")

    db.delete(db_plan)
    db.commit()
    return {"message": "Membership plan deleted successfully"}