from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, profile, aptitude
from database.db import user_collection
from security.jwt import get_password_hash
import asyncio

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(aptitude.router, prefix="/aptitude", tags=["aptitude"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Career Guidance Portal API"}

@app.on_event("startup")
async def ensure_default_admin():
    # Create a default admin user if none exists with the chosen email
    admin_email = "admin@myeduguide.local"
    existing = await user_collection.find_one({"email": admin_email})
    if existing:
        return
    password_hash = get_password_hash("admin")
    doc = {
        "name": "admin",
        "email": admin_email,
        "password_hash": password_hash,
        "role": "admin"
    }
    await user_collection.insert_one(doc)
    print("[startup] Seeded default admin user => email: admin@myeduguide.local password: admin (CHANGE IN PRODUCTION)")
