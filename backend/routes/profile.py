from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from models.profile import Profile
from database.db import profile_collection, user_collection
from security.jwt import get_current_user
from bson import ObjectId
import shutil
from pathlib import Path
from typing import Optional, List, Any, Dict
from datetime import date

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# -------------------------------------------------------------
# Simplified JSON-based profile model for new frontend wizard
# (coexists with the original multipart /create implementation)
# -------------------------------------------------------------
class SimpleProfile(BaseModel):
    # Personal Information
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    dateOfBirth: Optional[str] = None  # ISO date string
    cityVillage: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

    # Academic Information
    currentClass: Optional[str] = None
    school: Optional[str] = None
    board: Optional[str] = None
    previousYearPercentage: Optional[str] = None
    currentPerformanceLevel: Optional[str] = None
    strongSubjects: Optional[List[str]] = None

    # Interests and Goals
    careerInterests: Optional[str] = None
    preferredFields: Optional[List[str]] = None
    studyPreferences: Optional[str] = None

    # Family Context
    fatherOccupation: Optional[str] = None
    motherOccupation: Optional[str] = None
    familyIncome: Optional[str] = None
    familyEducationBackground: Optional[str] = None

    # Additional Information
    extracurricularActivities: Optional[str] = None
    challenges: Optional[str] = None
    supportNeeded: Optional[str] = None


def _legacy_to_simple(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Translate legacy snake_case profile to new camelCase shape if needed."""
    if not doc:
        return {}
    if 'firstName' in doc or 'first_name' not in doc:
        # Already new style or not legacy
        return doc
    mapping = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'date_of_birth': 'dateOfBirth',
        'city': 'cityVillage',
        'school_name': 'school',
        'career_interests': 'careerInterests',
        'parents_education_level': 'familyEducationBackground',
        'parents_occupation': 'fatherOccupation',  # best-effort (legacy stored combined)
    }
    translated = {k: v for k, v in doc.items() if k not in mapping.keys()}
    for old, new in mapping.items():
        if old in doc:
            translated[new] = doc[old]
    # Arrays best effort
    if 'favorite_subjects' in doc and 'strongSubjects' not in translated:
        translated['strongSubjects'] = doc.get('favorite_subjects', [])
    return translated


@router.get("/")
async def get_simple_profile(current_user: dict = Depends(get_current_user)):
    """Return profile in the simplified JSON format expected by the React wizard.

    If only a legacy profile exists, translate it. 404 if none found.
    """
    user = await user_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = await profile_collection.find_one({"user_id": str(user["_id"])})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if "_id" in profile:
        profile["_id"] = str(profile["_id"])
    return _legacy_to_simple(profile)


@router.post("/")
async def upsert_simple_profile(data: SimpleProfile, current_user: dict = Depends(get_current_user)):
    """Create or update profile using simplified JSON structure.

    Coexists with /create (multipart) so we only touch the fields provided,
    leaving any legacy fields intact unless overwritten.
    """
    user = await user_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(user["_id"])
    payload = {k: v for k, v in data.dict().items() if v is not None}
    payload["schema"] = "simple-v1"  # marker
    existing = await profile_collection.find_one({"user_id": user_id})
    if existing:
        await profile_collection.update_one({"user_id": user_id}, {"$set": payload})
        return {"message": "Profile updated", "profile": payload}
    else:
        doc = {"user_id": user_id, **payload}
        await profile_collection.insert_one(doc)
        return {"message": "Profile created", "profile": payload}

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
