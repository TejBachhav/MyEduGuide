from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, List
from datetime import date

class Profile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    
    # Personal Details
    first_name: str
    last_name: str
    age: int
    gender: str
    date_of_birth: date
    state: str
    district: str
    city: str
    
    # Academic Background
    school_name: str
    school_type: str  # Government/Private
    medium_of_instruction: str  # English/Hindi/Regional
    stream_exposure: Optional[str] = None
    class_9th_percentage: Optional[float] = None
    
    # Class 10th Prelim Marks (subject-wise)
    prelim_math: Optional[int] = None
    prelim_science: Optional[int] = None
    prelim_english: Optional[int] = None
    prelim_social_science: Optional[int] = None
    prelim_language: Optional[int] = None
    
    # Class 10th Board Results
    board_math: Optional[int] = None
    board_science: Optional[int] = None
    board_english: Optional[int] = None
    board_social_science: Optional[int] = None
    board_language: Optional[int] = None
    
    # Interests & Aspirations
    favorite_subjects: List[str] = []
    least_liked_subjects: List[str] = []
    career_interests: List[str] = []
    cocurricular_strengths: List[str] = []
    
    # Family / Contextual Info
    parents_occupation: str
    parents_education_level: str
    financial_aid_required: bool = False
    preferred_college_location: str
    
    # Document Uploads
    marksheet_path: Optional[str] = None
    id_proof_path: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
