from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGTEXT
from datetime import datetime
import enum
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class QuestionTypeEnum(str, enum.Enum):
    multiple_choice = "multiple_choice"
    multi_select = "multi_select"
    true_false = "true_false"
    short_answer = "short_answer"
    essay = "essay"
    fill_blank = "fill_blank"
    coding = "coding"

class GenerationTypeEnum(str, enum.Enum):
    manual = "manual"
    ai_generated = "ai_generated"
    ai_assisted = "ai_assisted"
    adaptive = "adaptive"

class SessionStatusEnum(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    timed_out = "timed_out"
    abandoned = "abandoned"

class GapTrendEnum(str, enum.Enum):
    improving = "improving"
    stable = "stable"
    declining = "declining"

class RecTypeEnum(str, enum.Enum):
    study = "study"
    practice = "practice"
    review = "review"
    challenge = "challenge"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=True) # Adding email as per schema
    username = Column(String(100), unique=True, nullable=False) # Keep username for old logic
    password = Column(String(255), nullable=False) # renamed from password_hash to match schema or keep as is.
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relations
    questions = relationship("Question", back_populates="author")
    tests_created = relationship("Test", back_populates="creator")
    sessions = relationship("TestSession", back_populates="student")
    knowledge_gaps = relationship("KnowledgeGap", back_populates="student")
    recommendations = relationship("AIRecommendation", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    topics = relationship("Topic", back_populates="subject")
    tests = relationship("Test", back_populates="subject")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    name = Column(String(255), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    subject = relationship("Subject", back_populates="topics")
    parent = relationship("Topic", remote_side=[id], backref="children")
    questions = relationship("Question", back_populates="topic")
    knowledge_gaps = relationship("KnowledgeGap", back_populates="topic")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(Enum(QuestionTypeEnum), default=QuestionTypeEnum.multiple_choice)
    body = Column(LONGTEXT, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty_level = Column(Integer, default=1) # 1-5
    bloom_level = Column(String(100), nullable=True) # remember, understand, apply, analyze, evaluate, create
    ai_difficulty_score = Column(Float, nullable=True) # 0.0 - 1.0
    ai_topic_tags = Column(JSON, nullable=True)
    time_limit_sec = Column(Integer, nullable=True)
    points_default = Column(Float, default=1.0)
    is_ai_generated = Column(Boolean, default=False)

    topic = relationship("Topic", back_populates="questions")
    author = relationship("User", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    media = relationship("QuestionMedia", back_populates="question", cascade="all, delete-orphan")
    statistics = relationship("QuestionStatistic", back_populates="question", uselist=False, cascade="all, delete-orphan")
    test_links = relationship("TestQuestion", back_populates="question")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    body = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)

    question = relationship("Question", back_populates="options")


class QuestionMedia(Base):
    __tablename__ = "question_media"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    media_type = Column(String(50), nullable=False) # e.g. image, video, audio
    url = Column(String(500), nullable=False)

    question = relationship("Question", back_populates="media")


class QuestionStatistic(Base):
    __tablename__ = "question_statistics"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, unique=True)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    avg_time_sec = Column(Float, default=0.0)
    difficulty_index = Column(Float, nullable=True)
    discrimination_idx = Column(Float, nullable=True)
    reliability_score = Column(Float, nullable=True)

    question = relationship("Question", back_populates="statistics")


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    generation_type = Column(Enum(GenerationTypeEnum), default=GenerationTypeEnum.manual)
    ai_config = Column(JSON, nullable=True)
    time_limit_min = Column(Integer, nullable=True)
    passing_score = Column(Float, nullable=True)
    max_attempts = Column(Integer, nullable=True)
    shuffle_questions = Column(Boolean, default=False)
    shuffle_options = Column(Boolean, default=False)
    show_result_after = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)

    subject = relationship("Subject", back_populates="tests")
    creator = relationship("User", back_populates="tests_created")
    test_questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan")
    sessions = relationship("TestSession", back_populates="test")


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    sort_order = Column(Integer, default=0)
    points = Column(Float, default=1.0)

    test = relationship("Test", back_populates="test_questions")
    question = relationship("Question", back_populates="test_links")


class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    status = Column(Enum(SessionStatusEnum), default=SessionStatusEnum.in_progress)
    total_score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    is_passed = Column(Boolean, nullable=True)
    time_spent_sec = Column(Integer, nullable=True)
    ai_summary = Column(Text, nullable=True)

    test = relationship("Test", back_populates="sessions")
    student = relationship("User", back_populates="sessions")
    answers = relationship("SessionAnswer", back_populates="session", cascade="all, delete-orphan")


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=True)
    text_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    points_earned = Column(Float, nullable=True)
    time_spent_sec = Column(Integer, nullable=True)
    ai_score = Column(Float, nullable=True) # 0.0 - 1.0
    ai_feedback = Column(Text, nullable=True)

    session = relationship("TestSession", back_populates="answers")
    ai_evaluation = relationship("AIEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    session_answer_id = Column(Integer, ForeignKey("session_answers.id"), nullable=False, unique=True)
    model_used = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    score = Column(Float, nullable=True) # 0.0 - 1.0
    feedback = Column(Text, nullable=True)
    rubric_scores = Column(JSON, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    answer = relationship("SessionAnswer", back_populates="ai_evaluation")


class KnowledgeGap(Base):
    __tablename__ = "knowledge_gaps"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    gap_score = Column(Float, nullable=True) # 0.0 - 1.0
    sessions_count = Column(Integer, default=0)
    correct_rate = Column(Float, nullable=True)
    trend = Column(Enum(GapTrendEnum), nullable=True)
    last_assessed_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="knowledge_gaps")
    topic = relationship("Topic", back_populates="knowledge_gaps")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    rec_type = Column(Enum(RecTypeEnum), nullable=False)
    message = Column(Text, nullable=False)
    resource_url = Column(String(500), nullable=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    is_read = Column(Boolean, default=False)
    is_acted = Column(Boolean, default=False)

    student = relationship("User", back_populates="recommendations")
    topic = relationship("Topic")


class StudentProfileStats(Base):
    __tablename__ = "student_profile_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    total_quizzes_taken = Column(Integer, default=0)
    total_questions_answered = Column(Integer, default=0)
    correct_answers_count = Column(Integer, default=0)
    overall_average_percentage = Column(Float, default=0.0)
    highest_score_percentage = Column(Float, default=0.0)
    total_study_time_min = Column(Integer, default=0)
    last_activity_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="profile_stats")


class DailyActivity(Base):
    __tablename__ = "daily_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_date = Column(DateTime, default=datetime.utcnow)
    questions_solved = Column(Integer, default=0)
    quizzes_completed = Column(Integer, default=0)
    average_daily_score = Column(Float, default=0.0)

    user = relationship("User", backref="daily_activities")

