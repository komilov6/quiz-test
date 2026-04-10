from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    surname: str
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    surname: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class TopicCreate(BaseModel):
    name: str
    content: Optional[str] = None
    content_type: str = "text"
    user_id: Optional[int] = None

class TopicResponse(BaseModel):
    id: int
    name: str
    content: Optional[str] = None
    content_type: str
    user_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class GenerateQuizRequest(BaseModel):
    topic_name: str
    topic_content: str
    question_count: int = 10
    difficulty: str = "medium"
    user_id: Optional[int] = None

class Question(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None

class QuizResponse(BaseModel):
    id: int
    topic_name: str
    question_count: int
    questions: List[Question]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubmitAnswerRequest(BaseModel):
    quiz_id: int
    answers: List[int]

class QuizResult(BaseModel):
    id: int
    topic_name: str
    score: int
    total: int
    percentage: float
    correct_answers: int
    wrong_answers: int
    status: str
    completed_at: datetime

class DashboardStats(BaseModel):
    total_quizzes: int
    total_users: int
    average_score: float
    top_scores: List[dict]

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class BookResponse(BaseModel):
    id: int
    category_id: int
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    pages: Optional[int] = None
    cover_image: Optional[str] = None
    pdf_path: Optional[str] = None
    
    class Config:
        from_attributes = True

class BookWithCategory(BookResponse):
    category_name: Optional[str] = None
    pdf_path: Optional[str] = None
