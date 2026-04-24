from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.models.models import (
    RoleEnum, QuestionTypeEnum, GenerationTypeEnum,
    SessionStatusEnum, GapTrendEnum, RecTypeEnum, PriorityEnum
)

# User Schemas
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class User(UserBase):
    id: int
    role: RoleEnum
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Subject & Topic Schemas
class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TopicBase(BaseModel):
    name: str
    subject_id: int
    parent_id: Optional[int] = None
    sort_order: int = 0

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

TopicResponse = Topic

# Question Schemas
class QuestionOptionBase(BaseModel):
    body: str
    is_correct: bool = False
    sort_order: int = 0

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOption(QuestionOptionBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    topic_id: int
    type: QuestionTypeEnum = QuestionTypeEnum.multiple_choice
    body: str
    explanation: Optional[str] = None
    difficulty_level: int = 1
    bloom_level: Optional[str] = None
    time_limit_sec: Optional[int] = None
    points_default: float = 1.0

class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] = []

class Question(QuestionBase):
    id: int
    author_id: Optional[int] = None
    ai_difficulty_score: Optional[float] = None
    ai_topic_tags: Optional[Dict[str, Any]] = None
    is_ai_generated: bool
    options: List[QuestionOption] = []

    class Config:
        from_attributes = True

# Test Schemas
class TestBase(BaseModel):
    title: str
    subject_id: Optional[int] = None
    generation_type: GenerationTypeEnum = GenerationTypeEnum.manual
    time_limit_min: Optional[int] = None
    passing_score: Optional[float] = None
    max_attempts: Optional[int] = None
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_result_after: bool = True
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None

class TestCreate(TestBase):
    pass

class Test(TestBase):
    id: int
    creator_id: int
    ai_config: Optional[Dict[str, Any]] = None
    is_published: bool

    class Config:
        from_attributes = True

class TestSessionBase(BaseModel):
    test_id: int

class TestSessionCreate(TestSessionBase):
    pass

class TestSession(TestSessionBase):
    id: int
    student_id: int
    attempt_number: int
    status: SessionStatusEnum
    total_score: Optional[float] = None
    percentage: Optional[float] = None
    is_passed: Optional[bool] = None
    time_spent_sec: Optional[int] = None
    ai_summary: Optional[str] = None

    class Config:
        from_attributes = True

class KnowledgeGap(BaseModel):
    id: int
    student_id: int
    topic_id: int
    gap_score: Optional[float] = None
    sessions_count: int
    correct_rate: Optional[float] = None
    trend: Optional[GapTrendEnum] = None
    last_assessed_at: datetime

    class Config:
        from_attributes = True

class AIRecommendation(BaseModel):
    id: int
    student_id: int
    topic_id: Optional[int] = None
    rec_type: RecTypeEnum
    message: str
    resource_url: Optional[str] = None
    priority: PriorityEnum
    is_read: bool
    is_acted: bool

    class Config:
        from_attributes = True

# Login Schemas (Keep old ones)
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Old API Request/Response Schemas for Compatibility
class GenerateQuizRequest(BaseModel):
    user_id: int
    topic_name: str
    topic_content: Optional[str] = ""
    question_count: int = 5
    difficulty: str = "medium"

class SubmitAnswerRequest(BaseModel):
    quiz_id: int
    answers: List[int]

class DashboardStats(BaseModel):
    total_quizzes: int
    total_users: int
    average_score: float
    top_scores: List[Dict[str, Any]]

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class BookWithCategory(BaseModel):
    id: int
    category_id: int
    title: str
    author: str
    description: Optional[str] = None
    level: Optional[str] = None
    pages: Optional[int] = None
    cover_image: Optional[str] = None
    category_name: Optional[str] = None
    pdf_path: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True
