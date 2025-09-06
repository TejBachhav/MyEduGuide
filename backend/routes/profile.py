from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from models.profile import Profile
from database.db import profile_collection, user_collection
from security.jwt import get_current_user
from bson import ObjectId
import shutil
from pathlib import Path
from typing import Optional, List
from datetime import date

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/create")
async def create_profile(
    # Personal Details
    first_name: str = Form(...),
    last_name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    date_of_birth: date = Form(...),
    state: str = Form(...),
    district: str = Form(...),
    city: str = Form(...),
    
    # Academic Background
    school_name: str = Form(...),
    school_type: str = Form(...),
    medium_of_instruction: str = Form(...),
    stream_exposure: Optional[str] = Form(None),
    class_9th_percentage: Optional[float] = Form(None),
    
    # Class 10th Prelim Marks
    prelim_math: Optional[int] = Form(None),
    prelim_science: Optional[int] = Form(None),
    prelim_english: Optional[int] = Form(None),
    prelim_social_science: Optional[int] = Form(None),
    prelim_language: Optional[int] = Form(None),
    
    # Class 10th Board Results
    board_math: Optional[int] = Form(None),
    board_science: Optional[int] = Form(None),
    board_english: Optional[int] = Form(None),
    board_social_science: Optional[int] = Form(None),
    board_language: Optional[int] = Form(None),
    
    # Interests & Aspirations (will be sent as comma-separated strings)
    favorite_subjects: str = Form(""),
    least_liked_subjects: str = Form(""),
    career_interests: str = Form(""),
    cocurricular_strengths: str = Form(""),
    
    # Family / Contextual Info
    parents_occupation: str = Form(...),
    parents_education_level: str = Form(...),
    financial_aid_required: bool = Form(False),
    preferred_college_location: str = Form(...),
    
    # Document Uploads
    marksheet: UploadFile = File(None),
    id_proof: UploadFile = File(None),
    
    current_user: dict = Depends(get_current_user)
):
    user = await user_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(user["_id"])

    # Handle file uploads
    marksheet_path = None
    id_proof_path = None
    
    if marksheet:
        marksheet_path = UPLOAD_DIR / f"{user_id}_marksheet_{marksheet.filename}"
        with marksheet_path.open("wb") as buffer:
            shutil.copyfileobj(marksheet.file, buffer)
        marksheet_path = str(marksheet_path)
    
    if id_proof:
        id_proof_path = UPLOAD_DIR / f"{user_id}_id_proof_{id_proof.filename}"
        with id_proof_path.open("wb") as buffer:
            shutil.copyfileobj(id_proof.file, buffer)
        id_proof_path = str(id_proof_path)

    # Parse comma-separated lists
    favorite_subjects_list = [s.strip() for s in favorite_subjects.split(",") if s.strip()]
    least_liked_subjects_list = [s.strip() for s in least_liked_subjects.split(",") if s.strip()]
    career_interests_list = [s.strip() for s in career_interests.split(",") if s.strip()]
    cocurricular_strengths_list = [s.strip() for s in cocurricular_strengths.split(",") if s.strip()]

    profile_data = {
        "user_id": user_id,
        "first_name": first_name,
        "last_name": last_name,
        "age": age,
        "gender": gender,
        "date_of_birth": date_of_birth.isoformat(),
        "state": state,
        "district": district,
        "city": city,
        "school_name": school_name,
        "school_type": school_type,
        "medium_of_instruction": medium_of_instruction,
        "stream_exposure": stream_exposure,
        "class_9th_percentage": class_9th_percentage,
        "prelim_math": prelim_math,
        "prelim_science": prelim_science,
        "prelim_english": prelim_english,
        "prelim_social_science": prelim_social_science,
        "prelim_language": prelim_language,
        "board_math": board_math,
        "board_science": board_science,
        "board_english": board_english,
        "board_social_science": board_social_science,
        "board_language": board_language,
        "favorite_subjects": favorite_subjects_list,
        "least_liked_subjects": least_liked_subjects_list,
        "career_interests": career_interests_list,
        "cocurricular_strengths": cocurricular_strengths_list,
        "parents_occupation": parents_occupation,
        "parents_education_level": parents_education_level,
        "financial_aid_required": financial_aid_required,
        "preferred_college_location": preferred_college_location,
        "marksheet_path": marksheet_path,
        "id_proof_path": id_proof_path
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
    
    profile = await profile_collection.find_one({"user_id": str(user["_id"])})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Convert ObjectId to string for JSON serialization
    if "_id" in profile:
        profile["_id"] = str(profile["_id"])
    
    return profile
