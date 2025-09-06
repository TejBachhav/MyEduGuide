from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..models.profile import Profile
from ..database.db import profile_collection, user_collection
from ..security.jwt import get_current_user
from bson import ObjectId
import shutil
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/create")
async def create_profile(
    surname: str,
    age: int,
    gender: str,
    background: str,
    prelim_marks: int = None,
    document: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    user = await user_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user["_id"]

    document_path = None
    if document:
        file_path = UPLOAD_DIR / document.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(document.file, buffer)
        document_path = str(file_path)

    profile_data = {
        "user_id": user_id,
        "surname": surname,
        "age": age,
        "gender": gender,
        "background": background,
        "prelim_marks": prelim_marks,
        "document_path": document_path
    }

    existing_profile = await profile_collection.find_one({"user_id": user_id})
    if existing_profile:
        await profile_collection.update_one({"user_id": user_id}, {"$set": profile_data})
        return {"message": "Profile updated successfully"}
    else:
        await profile_collection.insert_one(profile_data)
        return {"message": "Profile created successfully"}


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = await profile_collection.find_one({"user_id": user["_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Convert ObjectId to string for JSON serialization
    profile["_id"] = str(profile["_id"])
    profile["user_id"] = str(profile["user_id"])
    
    return profile
