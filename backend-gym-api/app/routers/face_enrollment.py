# face_enrollment.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from sqlalchemy.orm import Session
from PIL import Image
import numpy as np
import face_recognition
import io
import logging
from sqlalchemy import select

from .. import database, models, utils

router = APIRouter()

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

@router.post("/face-enroll/{user_id}")
async def face_enroll(
    user_id: int, 
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
        
        # Read file contents
        contents = await file.read()
        
        # Validate file size (limit to 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="File size too large. Maximum 10MB allowed."
            )

        logger.info(f"Processing face enrollment for user {user_id}")

        # Use Pillow to load and explicitly convert the image to 8-bit RGB
        try:
            img = Image.open(io.BytesIO(contents)).convert("RGB")
            logger.info(f"Image loaded successfully. Size: {img.size}")
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid image file: {str(e)}"
            )
        
        # Convert the Pillow image to a NumPy array
        img_np = np.array(img)
        logger.info(f"Image converted to numpy array. Shape: {img_np.shape}")

        # Find face locations
        face_locations = face_recognition.face_locations(img_np, model="hog")
        logger.info(f"Found {len(face_locations)} faces in the image")
        
        if len(face_locations) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="No faces detected in the image. Please ensure your face is clearly visible."
            )
        
        if len(face_locations) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Multiple faces detected. Please ensure only one face is visible in the image."
            )

        # Generate face encoding
        try:
            face_encodings = face_recognition.face_encodings(img_np, face_locations)
            if not face_encodings:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Could not generate face encoding. Please try with a clearer image."
                )

            face_encoding = face_encodings[0]

            # Debug: Log type and dtype
            logger.info(f"Face encoding type: {type(face_encoding)}, dtype: {getattr(face_encoding, 'dtype', None)}")

            # Ensure it’s a NumPy array
            if not isinstance(face_encoding, np.ndarray):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Invalid face encoding format: {type(face_encoding)}"
                )

            logger.info(f"Face encoding generated successfully. Shape: {face_encoding.shape}")
            
        except Exception as e:
            logger.error(f"Error generating face encoding: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Error processing face: {str(e)}"
            )

        # Check if user exists and has appropriate permissions
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found."
            )

        # Check branch permissions for trainers and admins
        if current_user.role in ["trainer", "admin"] and current_user.branch != user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="You can only enroll faces for users in your branch."
            )

        # Check for existing face encoding
        if user.face_encoding:
            logger.info(f"User {user_id} already has a face encoding. Updating...")

        # Store in database
        try:
            user.face_encoding = face_encoding.tobytes()
            db.commit()
            logger.info(f"Face encoding saved successfully for user {user_id}")
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error saving face encoding to database."
            )

        return {
            "message": f"Face enrolled successfully for user {user.name}",
            "user_id": user_id,
            "user_name": user.name
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error in face_enroll: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/enrolled-users")
async def get_enrolled_users(
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_trainer)
):
    """Get a list of user IDs for users who have face encodings enrolled"""
    try:
        # Use select() and scalars() to get a flat list of IDs
        stmt = select(models.User.id).filter(models.User.face_encoding.isnot(None))

        # Filter by branch for trainers and admins
        if current_user.role in ["trainer", "admin"] and current_user.branch:
            stmt = stmt.filter(models.User.branch == current_user.branch)

        enrolled_user_ids = db.execute(stmt).scalars().all()

        return {
            "enrolled_user_ids": enrolled_user_ids
        }

    except Exception as e:
        logger.error(f"Error fetching enrolled users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching enrolled users"
        )


@router.delete("/face-enroll/{user_id}")
async def delete_face_enrollment(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_trainer)
):
    """Remove face encoding for a user"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        # Check branch permissions
        if current_user.role in ["trainer", "admin"] and current_user.branch != user.branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage face enrollments for users in your branch."
            )

        if not user.face_encoding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have a face encoding enrolled."
            )

        user.face_encoding = None
        db.commit()
        
        return {
            "message": f"Face encoding removed successfully for user {user.name}",
            "user_id": user_id,
            "user_name": user.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting face enrollment: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing face encoding"
        )