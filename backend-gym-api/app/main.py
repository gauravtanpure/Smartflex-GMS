# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import users, auth, trainers, membership_plans  # ⬅️ Add this

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
# print("--- FastAPI app initialized and CORS middleware configured! ---")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Update if needed //
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(trainers.router)  # ⬅️ Add this line

from .routers import fee_management  # ⬅️ Import the new file you'll create

app.include_router(fee_management.router)  # ⬅️ Register router

app.include_router(membership_plans.router)