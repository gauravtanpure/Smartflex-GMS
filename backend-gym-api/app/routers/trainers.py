from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, utils  # ✅ Make sure utils is imported for password hashing

router = APIRouter(prefix="/trainers", tags=["Trainers"])


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
