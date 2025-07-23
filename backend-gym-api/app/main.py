from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import users, auth

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Update port if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
