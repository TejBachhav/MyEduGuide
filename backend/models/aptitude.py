from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from bson import ObjectId

class Question(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    category: str  # quant, logical, verbal, tech
    question: str
    type: str = "mcq"  # mcq | descriptive
    options: Optional[List[str]] = None  # only for mcq
    answer: Optional[str] = None  # correct answer (mcq) or model answer (optional for descriptive)
    difficulty: Optional[str] = "medium"  # easy/medium/hard

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class QuestionCreate(BaseModel):
    category: str
    question: str
    type: Optional[str] = "mcq"  # mcq or descriptive
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    difficulty: Optional[str] = "medium"

class AptitudeSubmission(BaseModel):
    answers: Dict[str, str]  # question_id -> chosen answer

class AptitudeResult(BaseModel):
    userId: str
    totalScore: int
    breakdown: Dict[str, int]
    totalQuestions: int

class StartTestResponse(BaseModel):
    testId: str
    durationMinutes: int
    questions: List[Question]
