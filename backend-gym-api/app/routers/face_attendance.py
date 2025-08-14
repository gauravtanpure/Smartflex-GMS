# face_attendance.py
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, models, utils
import face_recognition
import numpy as np
import io
from PIL import Image
from datetime import date
import logging
from typing import List
from app.utils import get_current_user

router = APIRouter(prefix="/face-attendance", tags=["Face Attendance"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_current_active_user(current_user = Depends(utils.get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

def get_current_trainer(current_user = Depends(get_current_active_user)):
    if current_user.role not in ["trainer", "admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Only trainers, admins, or superadmins can access this.",
        )
    return current_user

@router.post("/")
async def mark_attendance_from_face(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_trainer)
):
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read the image content
        contents = await file.read()
        
        # Validate file size (limit to 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum 10MB allowed."
            )

        logger.info("Processing face attendance request")

        try:
            # Use Pillow to open and convert the image to 8-bit RGB
            img = Image.open(io.BytesIO(contents)).convert("RGB")
            # Convert the Pillow image to a NumPy array for face_recognition
            img_np = np.array(img)
            logger.info(f"Image loaded successfully. Shape: {img_np.shape}")
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or unreadable image file: {e}"
            )

        # Query users with face encodings based on user permissions
        query = db.query(models.User).filter(models.User.face_encoding.isnot(None))
        
        # Filter by branch for trainers and admins
        if current_user.role in ["trainer", "admin"] and current_user.branch:
            query = query.filter(models.User.branch == current_user.branch)
        
        users = query.all()

        if not users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No users with face encodings found in your branch."
            )

        logger.info(f"Found {len(users)} users with face encodings")

        # Prepare known face data
        known_encodings = []
        known_ids = []
        known_names = {}
        known_branches = {}
        
        for user in users:
            try:
                encoding = np.frombuffer(user.face_encoding, dtype=np.float64)
                known_encodings.append(encoding)
                known_ids.append(user.id)
                known_names[user.id] = user.name
                known_branches[user.id] = user.branch
            except Exception as e:
                logger.warning(f"Error loading face encoding for user {user.id}: {e}")
                continue

        if not known_encodings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No valid face encodings found."
            )

        # Find faces in the uploaded image
        try:
            face_locations = face_recognition.face_locations(img_np, model="hog")
            face_encodings_in_image = face_recognition.face_encodings(img_np, face_locations)
            logger.info(f"Found {len(face_encodings_in_image)} faces in the uploaded image")
        except Exception as e:
            logger.error(f"Error processing faces in image: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing faces in image: {str(e)}"
            )

        if not face_encodings_in_image:
            return {
                "message": "No faces detected in the image.", 
                "present_user_ids": [],
                "recognized_users": []
            }

        marked_users = []
        recognized_users = []
        today = date.today()
        
        for unknown_encoding in face_encodings_in_image:
            try:
                # Compare the unknown face with known faces
                matches = face_recognition.compare_faces(
                    known_encodings, 
                    unknown_encoding, 
                    tolerance=0.5
                )
                
                # Calculate face distances to find the best match
                face_distances = face_recognition.face_distance(known_encodings, unknown_encoding)
                
                # Find the best match (smallest distance)
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    
                    # Check if it's a good match (distance < 0.5 and matches[best_match_index] is True)
                    if matches[best_match_index] and face_distances[best_match_index] < 0.5:
                        matched_id = known_ids[best_match_index]
                        matched_name = known_names[matched_id]
                        user_branch = known_branches[matched_id]
                        
                        logger.info(f"Face matched: User {matched_id} ({matched_name}) with distance {face_distances[best_match_index]:.3f}")
                        
                        # Check if attendance is already marked for today
                        existing_attendance = db.query(models.UserAttendance).filter(
                            models.UserAttendance.user_id == matched_id,
                            models.UserAttendance.date == today
                        ).first()

                        if existing_attendance:
                            logger.info(f"Attendance already marked for user {matched_id} on {today}")
                            recognized_users.append({
                                "user_id": matched_id,
                                "name": matched_name,
                                "status": "already_marked",
                                "existing_status": existing_attendance.status
                            })
                        else:
                            # Mark new attendance
                            try:
                                new_attendance = models.UserAttendance(
                                    user_id=matched_id,
                                    date=today,
                                    status="present",
                                    branch=user_branch
                                )
                                db.add(new_attendance)
                                marked_users.append(matched_id)
                                recognized_users.append({
                                    "user_id": matched_id,
                                    "name": matched_name,
                                    "status": "marked_present",
                                    "date": today.isoformat()
                                })
                                logger.info(f"Marked attendance for user {matched_id} ({matched_name})")
                            except Exception as e:
                                logger.error(f"Error marking attendance for user {matched_id}: {e}")
                                continue
                    else:
                        logger.info(f"Face not recognized well enough. Best distance: {face_distances[best_match_index]:.3f}")
                        
            except Exception as e:
                logger.error(f"Error processing face encoding: {e}")
                continue
        
        # Commit all attendance records
        try:
            if marked_users:
                db.commit()
                logger.info(f"Successfully committed attendance for {len(marked_users)} users")
            else:
                logger.info("No new attendance records to commit")
        except Exception as e:
            logger.error(f"Error committing attendance records: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error saving attendance records to database"
            )

        # Prepare response message
        if marked_users:
            message = f"Attendance marked successfully for {len(marked_users)} user(s)."
        elif recognized_users:
            already_marked = [u for u in recognized_users if u["status"] == "already_marked"]
            if already_marked:
                message = f"Recognized {len(already_marked)} user(s), but attendance was already marked for today."
            else:
                message = "Faces detected but no users were recognized."
        else:
            message = "No faces recognized in the image."

        return {
            "message": message,
            "present_user_ids": marked_users,
            "recognized_users": recognized_users,
            "total_faces_detected": len(face_encodings_in_image),
            "date": today.isoformat()
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error in mark_attendance_from_face: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing attendance: {str(e)}"
        )


@router.get("/attendance-stats")
async def get_attendance_stats(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_trainer),
    start_date: date = None,
    end_date: date = None
):
    """Get attendance statistics for the branch"""
    try:
        query = db.query(models.UserAttendance)
        
        # Filter by branch for trainers and admins
        if current_user.role in ["trainer", "admin"] and current_user.branch:
            query = query.filter(models.UserAttendance.branch == current_user.branch)
        
        # Apply date filters
        if start_date:
            query = query.filter(models.UserAttendance.date >= start_date)
        if end_date:
            query = query.filter(models.UserAttendance.date <= end_date)
        else:
            # Default to today if no end date specified
            query = query.filter(models.UserAttendance.date == date.today())
        
        attendance_records = query.all()
        
        # Calculate statistics
        total_records = len(attendance_records)
        present_count = len([r for r in attendance_records if r.status == "present"])
        absent_count = len([r for r in attendance_records if r.status == "absent"])
        
        # Get unique users count
        unique_users = len(set([r.user_id for r in attendance_records]))
        
        return {
            "total_records": total_records,
            "present_count": present_count,
            "absent_count": absent_count,
            "unique_users": unique_users,
            "attendance_rate": round((present_count / total_records * 100) if total_records > 0 else 0, 2),
            "date_range": {
                "start": start_date.isoformat() if start_date else date.today().isoformat(),
                "end": end_date.isoformat() if end_date else date.today().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting attendance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving attendance statistics"
        )


@router.post("/manual-attendance")
async def mark_manual_attendance(
    user_ids: List[int],
    attendance_date: date = None,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_trainer)
):
    """Manually mark attendance for multiple users"""
    try:
        if not attendance_date:
            attendance_date = date.today()
        
        # Verify all users exist and are in the correct branch
        query = db.query(models.User).filter(models.User.id.in_(user_ids))
        
        if current_user.role in ["trainer", "admin"] and current_user.branch:
            query = query.filter(models.User.branch == current_user.branch)
        
        users = query.all()
        found_user_ids = [u.id for u in users]
        missing_user_ids = [uid for uid in user_ids if uid not in found_user_ids]
        
        if missing_user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Users not found or not in your branch: {missing_user_ids}"
            )
        
        marked_users = []
        updated_users = []
        
        for user in users:
            # Check if attendance already exists
            existing = db.query(models.UserAttendance).filter(
                models.UserAttendance.user_id == user.id,
                models.UserAttendance.date == attendance_date
            ).first()
            
            if existing:
                if existing.status != "present":
                    existing.status = "present"
                    updated_users.append(user.id)
            else:
                new_attendance = models.UserAttendance(
                    user_id=user.id,
                    date=attendance_date,
                    status="present",
                    branch=user.branch
                )
                db.add(new_attendance)
                marked_users.append(user.id)
        
        db.commit()
        
        return {
            "message": f"Attendance processed for {len(user_ids)} users",
            "marked_new": marked_users,
            "updated_existing": updated_users,
            "date": attendance_date.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in manual attendance: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing manual attendance"
        )
    

@router.post("/face-attendance")
def mark_attendance(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        img = Image.open(BytesIO(file.file.read())).convert("RGB")
        img_np = np.array(img)
        face_locations = face_recognition.face_locations(img_np)
        face_encodings = face_recognition.face_encodings(img_np, face_locations)

        if not face_encodings:
            raise HTTPException(status_code=400, detail="No face detected.")

        captured_encoding = face_encodings[0]

        # Fetch all users with face encodings
        users = db.query(models.User).filter(models.User.face_encoding.isnot(None)).all()

        for user in users:
            stored_encoding = np.frombuffer(user.face_encoding, dtype=np.float64)
            match = face_recognition.compare_faces([stored_encoding], captured_encoding)[0]
            if match:
                # Record attendance
                new_record = models.Attendance(
                    user_id=user.id,
                    date=date.today(),
                    status="Present",
                    branch=user.branch
                )
                db.add(new_record)
                db.commit()
                return {"message": f"Attendance marked for {user.name}"}

        raise HTTPException(status_code=404, detail="No match found.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))