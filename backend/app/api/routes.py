from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import hashlib
import secrets

from app.core.database import get_db
from app.models import User, Topic, Quiz
from app.schemas import (
    UserCreate, UserResponse, UserUpdate, LoginRequest,
    TopicCreate, TopicResponse,
    GenerateQuizRequest, QuizResponse, Question,
    SubmitAnswerRequest, QuizResult, DashboardStats,
    CategoryResponse, BookResponse, BookWithCategory
)
from app.services.quiz_ai import quiz_ai

router = APIRouter(prefix="/api/v1")

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split('$')
        return hashlib.sha256((password + salt).encode()).hexdigest() == hashed
    except:
        return False

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")
    
    password_hash = hash_password(user.password)
    db_user = User(
        name=user.name,
        surname=user.surname,
        username=user.username,
        password_hash=password_hash
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/login", response_model=UserResponse)
async def login_user(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Username yoki parol noto'g'ri")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username yoki parol noto'g'ri")
    
    return user

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")
    
    password_hash = hash_password(user.password)
    db_user = User(
        name=user.name,
        surname=user.surname,
        username=user.username,
        password_hash=password_hash
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if 'password' in update_data and update_data['password']:
        update_data['password_hash'] = hash_password(update_data['password'])
        del update_data['password']
    
    if 'username' in update_data and update_data['username']:
        existing = await db.execute(select(User).where(User.username == update_data['username'], User.id != user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Bu username allaqachon band")
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.post("/topics", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, db: AsyncSession = Depends(get_db)):
    db_topic = Topic(**topic.model_dump())
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic

@router.post("/generate-quiz")
async def generate_quiz(request: GenerateQuizRequest, db: AsyncSession = Depends(get_db)):
    try:
        import re
        clean_content = request.topic_content
        if clean_content:
            clean_content = re.sub(r'https?://[^\s]*\.(jpg|jpeg|png|gif|image)[^\s]*', '', clean_content, flags=re.IGNORECASE)
            clean_content = re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', '', clean_content)
        
        questions = await quiz_ai.generate_quiz(
            topic_name=request.topic_name,
            topic_content=clean_content or "",
            question_count=request.question_count,
            difficulty=request.difficulty
        )
        
        db_quiz = Quiz(
            user_id=request.user_id,
            topic_name=request.topic_name,
            question_count=request.question_count,
            questions=questions,
            status="ready"
        )
        db.add(db_quiz)
        await db.commit()
        await db.refresh(db_quiz)
        
        return {
            "id": db_quiz.id,
            "topic_name": db_quiz.topic_name,
            "question_count": db_quiz.question_count,
            "difficulty": request.difficulty,
            "questions": questions,
            "status": db_quiz.status,
            "created_at": db_quiz.created_at.isoformat() if db_quiz.created_at else None
        }
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower():
            raise HTTPException(status_code=504, detail="AI javob berishda timeout. Ozgaruvchan server tezligi tufayli kamroq savol sonini tanlang.")
        elif "connection" in error_msg.lower():
            raise HTTPException(status_code=503, detail="AI serverga ulanib bo'lmayapti. Ollama ishlab turganligini tekshiring.")
        raise HTTPException(status_code=500, detail=f"Xatolik: {error_msg[:100]}")

@router.post("/submit-quiz")
async def submit_quiz(request: SubmitAnswerRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == request.quiz_id))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
    
    if quiz.status != "ready":
        raise HTTPException(status_code=400, detail="Bu quiz allaqachon yakunlangan")
    
    questions = quiz.questions
    user_answers = request.answers
    
    score = 0
    for i, ans in enumerate(user_answers):
        if i < len(questions) and ans == questions[i]["correct_answer"]:
            score += 1
    
    quiz.answers = user_answers
    quiz.score = score
    quiz.total = len(questions)
    quiz.status = "completed"
    quiz.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(quiz)
    
    wrong = quiz.total - quiz.score
    percentage = (quiz.score / quiz.total * 100) if quiz.total > 0 else 0
    
    return {
        "quiz_id": quiz.id,
        "score": quiz.score,
        "total": quiz.total,
        "percentage": round(percentage, 1),
        "correct_answers": quiz.score,
        "wrong_answers": wrong,
        "status": quiz.status
    }

@router.get("/quiz/{quiz_id}")
async def get_quiz(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
    
    if quiz.status == "completed":
        questions_with_results = []
        for i, q in enumerate(quiz.questions):
            user_answer = quiz.answers[i] if quiz.answers and i < len(quiz.answers) else -1
            is_correct = user_answer == q["correct_answer"]
            questions_with_results.append({
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "user_answer": user_answer,
                "is_correct": is_correct,
                "explanation": q.get("explanation", "")
            })
        
        return {
            "id": quiz.id,
            "topic_name": quiz.topic_name,
            "status": quiz.status,
            "score": quiz.score,
            "total": quiz.total,
            "percentage": round((quiz.score / quiz.total * 100) if quiz.total > 0 else 0, 1),
            "completed_at": quiz.completed_at,
            "questions": questions_with_results
        }
    
    questions_for_user = [
        {
            "question": q["question"],
            "options": q["options"]
        }
        for q in quiz.questions
    ]
    
    return {
        "id": quiz.id,
        "topic_name": quiz.topic_name,
        "question_count": quiz.question_count,
        "questions": questions_for_user,
        "status": quiz.status
    }

@router.get("/user/{user_id}/results")
async def get_user_results(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quiz).where(Quiz.user_id == user_id, Quiz.status == "completed").order_by(Quiz.completed_at.desc())
    )
    quizzes = result.scalars().all()
    
    return [
        {
            "id": q.id,
            "topic_name": q.topic_name,
            "score": q.score,
            "total": q.total,
            "percentage": round((q.score / q.total * 100) if q.total > 0 else 0, 1),
            "completed_at": q.completed_at
        }
        for q in quizzes
    ]

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar() or 0
    
    quizzes_result = await db.execute(
        select(Quiz).where(Quiz.status == "completed")
    )
    quizzes = quizzes_result.scalars().all()
    total_quizzes = len(quizzes)
    
    average_score = 0
    if quizzes:
        total_percentage = sum((q.score / q.total * 100) if q.total > 0 else 0 for q in quizzes)
        average_score = round(total_percentage / len(quizzes), 1)
    
    top_scores = [
        {
            "user_id": q.user_id,
            "topic": q.topic_name,
            "score": q.score,
            "total": q.total,
            "percentage": round((q.score / q.total * 100) if q.total > 0 else 0, 1)
        }
        for q in quizzes[:10]
    ]
    
    return DashboardStats(
        total_quizzes=total_quizzes,
        total_users=total_users,
        average_score=average_score,
        top_scores=top_scores
    )

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@router.post("/quiz-recommendations")
async def get_quiz_recommendations(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
    
    if quiz.status != "completed":
        raise HTTPException(status_code=400, detail="Quiz hali yakunlanmagan")
    
    wrong_questions = []
    for i, q in enumerate(quiz.questions):
        user_answer = quiz.answers[i] if quiz.answers and i < len(quiz.answers) else -1
        if user_answer != q["correct_answer"]:
            wrong_questions.append(q)
    
    try:
        recommendations = await quiz_ai.get_recommendations(
            topic_name=quiz.topic_name,
            score=quiz.score,
            total=quiz.total,
            wrong_questions=wrong_questions
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI tavsiyalar olishda xatolik: {str(e)[:100]}")

@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    result = await db.execute(text("SELECT id, name, icon, color, description FROM categories ORDER BY id"))
    categories = result.fetchall()
    return [
        CategoryResponse(
            id=row[0],
            name=row[1],
            icon=row[2],
            color=row[3],
            description=row[4]
        )
        for row in categories
    ]

@router.get("/books", response_model=list[BookWithCategory])
async def get_books(category_id: int = None, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    if category_id:
        result = await db.execute(
            text("""SELECT b.id, b.category_id, b.title, b.author, b.description, b.level, b.pages, b.cover_image, c.name, b.pdf_path 
                     FROM books b LEFT JOIN categories c ON b.category_id = c.id 
                     WHERE b.category_id = :category_id ORDER BY b.title"""),
            {"category_id": category_id}
        )
    else:
        result = await db.execute(
            text("""SELECT b.id, b.category_id, b.title, b.author, b.description, b.level, b.pages, b.cover_image, c.name, b.pdf_path 
                     FROM books b LEFT JOIN categories c ON b.category_id = c.id 
                     ORDER BY c.id, b.title""")
        )
    books = result.fetchall()
    return [
        BookWithCategory(
            id=row[0],
            category_id=row[1],
            title=row[2],
            author=row[3],
            description=row[4],
            level=row[5],
            pages=row[6],
            cover_image=row[7],
            category_name=row[8],
            pdf_path=row[9] if len(row) > 9 else None
        )
        for row in books
    ]

@router.get("/books/{book_id}", response_model=BookWithCategory)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    result = await db.execute(
        text("""SELECT b.id, b.category_id, b.title, b.author, b.description, b.level, b.pages, b.cover_image, c.name, b.pdf_path 
                 FROM books b LEFT JOIN categories c ON b.category_id = c.id 
                 WHERE b.id = :book_id"""),
        {"book_id": book_id}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Kitob topilmadi")
    return BookWithCategory(
        id=row[0],
        category_id=row[1],
        title=row[2],
        author=row[3],
        description=row[4],
        level=row[5],
        pages=row[6],
        cover_image=row[7],
        category_name=row[8],
        pdf_path=row[9] if len(row) > 9 else None
    )
