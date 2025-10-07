# backend/routers/fee_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from .. import models, schemas, database, utils
from datetime import date, datetime # Import date and datetime
import uuid

router = APIRouter(prefix="/fees", tags=["Fee Management"])

# --- NEW HELPER FUNCTION FOR SENDING PAYMENT EMAIL ---
def send_payment_receipt_email(db: Session, fee: models.FeeAssignment):
    """
    Fetches user details and sends a payment confirmation email.
    """
    user = db.query(models.User).filter(models.User.id == fee.user_id).first()
    if not user:
        print(f"Could not find user with ID {fee.user_id} to send payment receipt.")
        return

    subject = f"Payment Confirmation - {fee.fee_type}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ width: 90%; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: #FF6600; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .footer {{ background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #777; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            .details-table th, .details-table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            .details-table th {{ background-color: #f9f9f9; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Payment Successful!</h1>
            </div>
            <div class="content">
                <p>Dear {user.name},</p>
                <p>We have successfully received your payment. Thank you for your promptness.</p>
                <p>Here are the details of your transaction:</p>
                <table class="details-table">
                    <tr>
                        <th>Fee Type</th>
                        <td>{fee.fee_type}</td>
                    </tr>
                    <tr>
                        <th>Amount Paid</th>
                        <td>₹{fee.amount:.2f}</td>
                    </tr>
                    <tr>
                        <th>Payment Method</th>
                        <td>{fee.payment_type or 'N/A'}</td>
                    </tr>
                     <tr>
                        <th>Payment Date</th>
                        <td>{datetime.utcnow().strftime('%d %B %Y')}</td>
                    </tr>
                </table>
                <p>Your account is up to date. If you have any questions, feel free to contact us.</p>
                <p>Stay Fit, Stay Healthy!<br>The SmartFlex Fitness Team</p>
            </div>
            <div class="footer">
                <p>&copy; {datetime.utcnow().year} SmartFlex Fitness. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    utils.send_email(to_email=user.email, subject=subject, html_content=html_content)
# --- END NEW HELPER ---


# Dependency to get current superadmin
def get_current_superadmin(current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only superadmins can perform this action.")
    return current_user

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
    # ⬅️ UPDATED LOGIC: Superadmins can assign to any user, admins only to their branch users
    if current_admin.role == "admin" and user.branch != current_admin.branch:
         raise HTTPException(status_code=403, detail="You do not have permission to assign fees to this user. Admins can only assign to users in their own branch.")

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
@router.get("/branch", response_model=List[schemas.FeeAssignmentNestedResponse])
def get_branch_fees(
    db: Session = Depends(database.get_db),
    current_admin: schemas.UserResponse = Depends(get_current_admin),  # Only admins/superadmins can access this
    user_id: Optional[int] = None,  # Optional filter by user ID
    is_paid: Optional[bool] = None  # Optional filter by paid status
):
    """
    Allows branch admins and superadmins to view fee assignments for their branch.
    Superadmins can see fees from all branches.
    """
    query = db.query(models.FeeAssignment).join(
        models.User, models.FeeAssignment.user_id == models.User.id
    )

    if current_admin.role == "admin":
        if not current_admin.branch:
            raise HTTPException(status_code=400, detail="Admin's branch not specified.")
        query = query.filter(models.FeeAssignment.branch_name == current_admin.branch)
    # Superadmins see all fees (no branch filter)

    if user_id is not None:
        query = query.filter(models.FeeAssignment.user_id == user_id)
    if is_paid is not None:
        query = query.filter(models.FeeAssignment.is_paid == is_paid)

    fees = query.all()

    result = []
    for fee_assignment in fees:
        user_data = db.query(models.User).filter(models.User.id == fee_assignment.user_id).first()
        if user_data:
            fee_assignment_dict = fee_assignment.__dict__.copy()
            fee_assignment_dict["user"] = schemas.UserResponse.from_orm(user_data)
            result.append(schemas.FeeAssignmentNestedResponse(**fee_assignment_dict))
        else:
            result.append(schemas.FeeAssignmentNestedResponse.from_orm(fee_assignment))
    return result

# NEW ENDPOINT: Get all fees for all users (superadmin only)
@router.get("/all", response_model=List[schemas.FeeAssignmentResponse])
def get_all_fees(
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin)
):
    fees = db.query(models.FeeAssignment).all()
    result = []
    for fee in fees:
        user = db.query(models.User).filter(models.User.id == fee.user_id).first()
        assigned_by_user = db.query(models.User).filter(models.User.id == fee.assigned_by_user_id).first()
        fee_dict = fee.__dict__.copy()
        fee_dict['user_name'] = user.name if user else "N/A"
        fee_dict['assigned_by_name'] = assigned_by_user.name if assigned_by_user else "N/A"
        result.append(schemas.FeeAssignmentResponse(**fee_dict))
    
    return result

# NEW ENDPOINT: Mark a fee as paid/unpaid and generate a receipt (superadmin only)
@router.patch("/{fee_id}", response_model=schemas.FeeAssignmentResponse)
def update_fee_status(
    fee_id: int,
    fee_update: schemas.FeeAssignmentUpdate,
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin)
):
    fee = db.query(models.FeeAssignment).filter(models.FeeAssignment.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee assignment not found.")
    
    fee.is_paid = fee_update.is_paid
    fee.payment_type = fee_update.payment_type

    if fee.is_paid and not db.query(models.FeeReceipt).filter(models.FeeReceipt.fee_assignment_id == fee.id).first():
        # Generate a unique receipt number
        receipt_number = f"REC-{uuid.uuid4().hex[:8].upper()}"
        
        # Create a receipt
        receipt = models.FeeReceipt(
            fee_assignment_id=fee.id,
            user_id=fee.user_id,
            amount=fee.amount,
            payment_type=fee.payment_type,
            receipt_number=receipt_number
        )
        db.add(receipt)

    db.commit()
    db.refresh(fee)

    # --- ADDED: Send email if fee is marked as paid ---
    if fee.is_paid:
        send_payment_receipt_email(db, fee)
    # --- END ---

    user = db.query(models.User).filter(models.User.id == fee.user_id).first()
    assigned_by_user = db.query(models.User).filter(models.User.id == fee.assigned_by_user_id).first()
    fee_dict = fee.__dict__.copy()
    fee_dict['user_name'] = user.name if user else "N/A"
    fee_dict['assigned_by_name'] = assigned_by_user.name if assigned_by_user else "N/A"

    return schemas.FeeAssignmentResponse(**fee_dict)

@router.get("/{fee_id}/receipt", response_model=schemas.FeeReceiptResponse)
def get_fee_receipt(
    fee_id: int,
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin)
):
    receipt = db.query(models.FeeReceipt).filter(models.FeeReceipt.fee_assignment_id == fee_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found for this fee.")
    
    user = db.query(models.User).filter(models.User.id == receipt.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    receipt_data = schemas.FeeReceiptResponse(
        receipt_number=receipt.receipt_number,
        user_name=user.name,
        fee_type=receipt.fee_assignment.fee_type,
        amount=receipt.amount,
        payment_type=receipt.payment_type,
        payment_date=receipt.payment_date
    )
    return receipt_data


@router.get("/analytics", response_model=schemas.FeeAnalyticsResponse)
def get_fee_analytics(
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin)
):
    total_fees_assigned = db.query(func.sum(models.FeeAssignment.amount)).scalar() or 0
    total_fees_paid = db.query(func.sum(models.FeeAssignment.amount)).filter(models.FeeAssignment.is_paid == True).scalar() or 0
    total_outstanding_fees = total_fees_assigned - total_fees_paid

    paid_by_card = db.query(func.sum(models.FeeAssignment.amount)).filter(models.FeeAssignment.payment_type == "Card").scalar() or 0
    paid_by_cash = db.query(func.sum(models.FeeAssignment.amount)).filter(models.FeeAssignment.payment_type == "Cash").scalar() or 0
    paid_by_upi = db.query(func.sum(models.FeeAssignment.amount)).filter(models.FeeAssignment.payment_type == "UPI").scalar() or 0
    paid_by_cheque = db.query(func.sum(models.FeeAssignment.amount)).filter(models.FeeAssignment.payment_type == "Cheque").scalar() or 0

    return schemas.FeeAnalyticsResponse(
        total_fees_assigned=total_fees_assigned,
        total_fees_paid=total_fees_paid,
        total_outstanding_fees=total_outstanding_fees,
        paid_by_card=paid_by_card,
        paid_by_cash=paid_by_cash,
        paid_by_upi=paid_by_upi,
        paid_by_cheque=paid_by_cheque
    )

from io import BytesIO
from openpyxl import Workbook
from fastapi.responses import StreamingResponse
from typing import Dict, List

from fastapi import Query

@router.get("/monthly-revenue", response_model=List[schemas.MonthlyRevenueResponse])
def get_monthly_revenue(
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin),
    start_month: str = Query(None, description="YYYY-MM"),
    end_month: str = Query(None, description="YYYY-MM")
):
    revenue_map: Dict[str, float] = {}

    try:
        receipts = db.query(models.FeeReceipt).filter(models.FeeReceipt.payment_date != None).all()
    except Exception:
        receipts = []

    if receipts:
        for r in receipts:
            if not r.payment_date:
                continue
            month_key = r.payment_date.strftime("%Y-%m")
            revenue_map[month_key] = revenue_map.get(month_key, 0.0) + float(r.amount or 0.0)
    else:
        assignments = db.query(models.FeeAssignment).filter(models.FeeAssignment.is_paid == True).all()
        for a in assignments:
            dt = getattr(a, "updated_at", None) or getattr(a, "created_at", None)
            if not dt:
                continue
            month_key = dt.strftime("%Y-%m")
            revenue_map[month_key] = revenue_map.get(month_key, 0.0) + float(a.amount or 0.0)

    # Filter by start/end month if provided
    months = sorted(revenue_map.keys(), reverse=True)
    if start_month:
        months = [m for m in months if m >= start_month]
    if end_month:
        months = [m for m in months if m <= end_month]

    items = [{"month": m, "total": revenue_map[m]} for m in months]
    return items


@router.get("/export/monthly")
def export_monthly_revenue(
    db: Session = Depends(database.get_db),
    current_superadmin: schemas.UserResponse = Depends(get_current_superadmin),
    start_month: str = Query(None, description="YYYY-MM"),
    end_month: str = Query(None, description="YYYY-MM")
):
    revenue_map: Dict[str, float] = {}

    try:
        receipts = db.query(models.FeeReceipt).filter(models.FeeReceipt.payment_date != None).all()
    except Exception:
        receipts = []

    if receipts:
        for r in receipts:
            if not r.payment_date:
                continue
            month_key = r.payment_date.strftime("%Y-%m")
            revenue_map[month_key] = revenue_map.get(month_key, 0.0) + float(r.amount or 0.0)
    else:
        assignments = db.query(models.FeeAssignment).filter(models.FeeAssignment.is_paid == True).all()
        for a in assignments:
            dt = getattr(a, "updated_at", None) or getattr(a, "created_at", None)
            if not dt:
                continue
            month_key = dt.strftime("%Y-%m")
            revenue_map[month_key] = revenue_map.get(month_key, 0.0) + float(a.amount or 0.0)

    # Filter by date range
    months = sorted(revenue_map.keys(), reverse=True)
    if start_month:
        months = [m for m in months if m >= start_month]
    if end_month:
        months = [m for m in months if m <= end_month]

    # Create Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Monthly Revenue"
    ws.append(["Month", "Total Revenue (INR)"])

    for month in months:
        ws.append([month, round(revenue_map[month], 2)])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"monthly_revenue_{start_month or 'all'}_{end_month or 'all'}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



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
        # --- ADDED: Set payment type for manual marking ---
        if db_fee.is_paid:
            db_fee.payment_type = "Manual" # Or you could pass this from the frontend
    # if update_data.amount is not None:
    #     db_fee.amount = update_data.amount
    # if update_data.due_date is not None:
    #     db_fee.due_date = update_data.due_date

    db.commit()
    db.refresh(db_fee)
    
    # --- ADDED: Send email if fee is marked as paid ---
    if db_fee.is_paid:
        send_payment_receipt_email(db, db_fee)
    # --- END ---

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

import razorpay
from fastapi import Request
from starlette.responses import JSONResponse
import os

razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

# ✅ Create Razorpay Order
@router.post("/{fee_id}/create-order")
def create_order(fee_id: int, db: Session = Depends(database.get_db), current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    fee = db.query(models.FeeAssignment).filter(models.FeeAssignment.id == fee_id, models.FeeAssignment.user_id == current_user.id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found or not assigned to you.")

    if fee.is_paid:
        raise HTTPException(status_code=400, detail="Fee already paid.")

    # Create Razorpay order
    order_data = {
        "amount": fee.amount * 100,  # amount in paise
        "currency": "INR",
        "receipt": f"receipt_fee_{fee.id}",
        "payment_capture": 1
    }
    order = razorpay_client.order.create(order_data)

    return {"order_id": order["id"], "amount": order_data["amount"], "currency": order_data["currency"], "key": os.getenv("RAZORPAY_KEY_ID")}

#---Payment Gateway Integration

# ✅ Verify Payment
@router.post("/verify-payment")
async def verify_payment(request: Request, db: Session = Depends(database.get_db), current_user: schemas.UserResponse = Depends(utils.get_current_user)):
    data = await request.json()

    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    fee_id = data.get("fee_id")

    try:
        # Verify signature
        params_dict = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)

        # Update DB fee as paid
        fee = db.query(models.FeeAssignment).filter(models.FeeAssignment.id == fee_id, models.FeeAssignment.user_id == current_user.id).first()
        if not fee:
            raise HTTPException(status_code=404, detail="Fee not found")

        fee.is_paid = True
        fee.payment_type = "Razorpay" # Or another identifier like 'Online'
        db.commit()

        # --- ADDED: Send email after successful online payment ---
        send_payment_receipt_email(db, fee)
        # --- END ---

        return {"status": "success", "message": "Payment verified and fee updated!"}
    except:
        raise HTTPException(status_code=400, detail="Payment verification failed.")