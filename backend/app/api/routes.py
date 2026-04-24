from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
import csv
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from sqlalchemy.orm import selectinload
from datetime import datetime
import hashlib
import secrets

from app.core.database import get_db
from app.models.models import (
    User, Subject, Topic, Question, QuestionOption, Test, TestQuestion, 
    TestSession, SessionAnswer, GenerationTypeEnum, SessionStatusEnum
)
from app.schemas.schemas import (
    UserCreate, UserResponse, UserUpdate, LoginRequest,
    TopicCreate, TopicResponse,
    GenerateQuizRequest, DashboardStats,
    CategoryResponse, BookWithCategory
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
        username=user.username,
        email=user.email,
        password=password_hash
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
    
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Username yoki parol noto'g'ri")
    
    return user

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(user, db)

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
        update_data['password'] = hash_password(update_data['password'])
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


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
            difficulty=request.difficulty,
            db=db
        )
        
        # 1. Subject mavjudligini tekshirish (nomi bo'yicha qidiramiz, ID 1 emas)
        subj_res = await db.execute(select(Subject).where(Subject.name == "General AI Quizzes"))
        subject = subj_res.scalar_one_or_none()
        if not subject:
            subject = Subject(name="General AI Quizzes", description="Avtomatik yaratilgan fan")
            db.add(subject)
            await db.flush()
            
        # 2. User (Creator) mavjudligini tekshirish
        user_res = await db.execute(select(User).where(User.id == request.user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            # Agar foydalanuvchi topilmasa, bazadagi birinchi adminni olamiz
            user_res = await db.execute(select(User).limit(1))
            user = user_res.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=400, detail="Tizimda foydalanuvchi topilmadi. Iltimos, registratsiya qiling.")

        topic = Topic(subject_id=subject.id, name=request.topic_name)
        db.add(topic)
        await db.flush()
        
        # 2. Create the Test
        db_test = Test(
            creator_id=user.id,
            subject_id=subject.id,
            title=f"Quiz: {request.topic_name}",
            generation_type=GenerationTypeEnum.ai_generated,
            is_published=True
        )
        db.add(db_test)
        await db.flush()
        
        # 3. Add Questions, Options and TestLinks
        for i, q in enumerate(questions):
            db_q = Question(
                topic_id=topic.id,
                author_id=user.id,
                body=q["question"],
                explanation=q.get("explanation"),
                is_ai_generated=True
            )
            db.add(db_q)
            await db.flush()
            
            for opt_idx, opt_text in enumerate(q["options"]):
                db.add(QuestionOption(
                    question_id=db_q.id,
                    body=opt_text,
                    is_correct=(opt_idx == q["correct_answer"]),
                    sort_order=opt_idx
                ))
                
            db.add(TestQuestion(
                test_id=db_test.id,
                question_id=db_q.id,
                sort_order=i
            ))
            
        await db.commit()
        await db.refresh(db_test)
        
        return {
            "id": db_test.id,
            "topic_name": request.topic_name,
            "question_count": request.question_count,
            "difficulty": request.difficulty,
            "questions": questions,
            "status": "ready",
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower():
            raise HTTPException(status_code=504, detail="AI javob berishda timeout.")
        raise HTTPException(status_code=500, detail=f"Xatolik: {error_msg[:100]}")


@router.post("/submit-quiz")
async def submit_quiz(request: dict, db: AsyncSession = Depends(get_db)):
    quiz_id = request.get("quiz_id")
    user_id = request.get("user_id")
    answers = request.get("answers", [])
    
    # Validate user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    result = await db.execute(
        select(Test).where(Test.id == quiz_id).options(
            selectinload(Test.test_questions).selectinload(TestQuestion.question).selectinload(Question.options)
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
        
    tqs = sorted(test.test_questions, key=lambda tq: tq.sort_order)
    
    score = 0
    total = len(tqs)
    
    # create test session
    session = TestSession(
        test_id=test.id,
        student_id=user_id or test.creator_id, # Use provided user_id or fallback to creator
        status=SessionStatusEnum.completed
    )
    db.add(session)
    await db.flush()
    
    for i, ans_idx in enumerate(answers):
        if i >= total: break
        q = tqs[i].question
        
        # find the actual QuestionOption
        opts = sorted(q.options, key=lambda o: o.sort_order)
        selected_opt = opts[ans_idx] if ans_idx >= 0 and ans_idx < len(opts) else None
        
        is_correct = False
        if selected_opt and selected_opt.is_correct:
            is_correct = True
            score += 1
            
        sa = SessionAnswer(
            session_id=session.id,
            question_id=q.id,
            selected_option_id=selected_opt.id if selected_opt else None,
            is_correct=is_correct,
            points_earned=1.0 if is_correct else 0.0
        )
        db.add(sa)
        
    percentage = (score / total * 100) if total > 0 else 0
    session.total_score = score
    session.percentage = percentage
    session.is_passed = percentage >= (test.passing_score or 50.0)
    
    await db.commit()
    
    # 💥 YANGI: Alohida statistika bazasini yangilash
    try:
        from app.models.models import StudentProfileStats, DailyActivity
        from sqlalchemy import and_
        
        # 1. Umumiy profil stats
        stats_res = await db.execute(select(StudentProfileStats).where(StudentProfileStats.user_id == session.student_id))
        user_stats = stats_res.scalar_one_or_none()
        if not user_stats:
            user_stats = StudentProfileStats(
                user_id=session.student_id,
                total_quizzes_taken=0,
                total_questions_answered=0,
                correct_answers_count=0,
                overall_average_percentage=0.0,
                highest_score_percentage=0.0
            )
            db.add(user_stats)
        
        user_stats.total_quizzes_taken += 1
        user_stats.total_questions_answered += total
        user_stats.correct_answers_count += score
        user_stats.overall_average_percentage = (user_stats.overall_average_percentage * (user_stats.total_quizzes_taken-1) + percentage) / user_stats.total_quizzes_taken
        if percentage > user_stats.highest_score_percentage:
            user_stats.highest_score_percentage = percentage
        user_stats.last_activity_at = datetime.utcnow()
        
        # 2. Kunlik faollik
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_res = await db.execute(select(DailyActivity).where(and_(DailyActivity.user_id == session.student_id, DailyActivity.activity_date == today)))
        daily = daily_res.scalar_one_or_none()
        if not daily:
            daily = DailyActivity(
                user_id=session.student_id, 
                activity_date=today,
                questions_solved=0,
                quizzes_completed=0,
                average_daily_score=0.0
            )
            db.add(daily)
        
        daily.questions_solved += total
        daily.quizzes_completed += 1
        daily.average_daily_score = (daily.average_daily_score * (daily.quizzes_completed-1) + percentage) / daily.quizzes_completed
        
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Statistika yangilashda xato: {e}")
    
    return await get_quiz(test.id, db)


@router.get("/quiz/{quiz_id}")
async def get_quiz(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Test).where(Test.id == quiz_id).options(
            selectinload(Test.test_questions).selectinload(TestQuestion.question).selectinload(Question.options),
            selectinload(Test.sessions).selectinload(TestSession.answers)
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
        
    tqs = sorted(test.test_questions, key=lambda tq: tq.sort_order)
    
    sessions = [s for s in test.sessions if s.status == SessionStatusEnum.completed]
    latest_session = sorted(sessions, key=lambda x: x.id, reverse=True)[0] if sessions else None
    
    if latest_session:
        questions_with_results = []
        wrong_questions = []
        answers_dict = {ans.question_id: ans for ans in latest_session.answers}
        
        for tq in tqs:
            q = tq.question
            opts = sorted(q.options, key=lambda o: o.sort_order)
            opt_texts = [o.body for o in opts]
            correct_idx = next((i for i, o in enumerate(opts) if o.is_correct), 0)
            
            ans_record = answers_dict.get(q.id)
            user_ans_idx = -1
            if ans_record and ans_record.selected_option_id:
                user_ans_idx = next((i for i, o in enumerate(opts) if o.id == ans_record.selected_option_id), -1)
                
            questions_with_results.append({
                "question": q.body,
                "options": opt_texts,
                "correct_answer": correct_idx,
                "user_answer": user_ans_idx,
                "is_correct": ans_record.is_correct if ans_record else False,
                "explanation": q.explanation or ""
            })
            
            if ans_record and not ans_record.is_correct:
                wrong_questions.append({
                    "question": q.body,
                    "options": opt_texts,
                    "selectedAnswer": user_ans_idx,
                    "correctAnswer": correct_idx
                })
            
        return {
            "id": test.id,
            "topic_name": test.title.replace("Quiz: ", ""),
            "status": "completed",
            "score": latest_session.total_score,
            "total": len(tqs),
            "percentage": latest_session.percentage or 0,
            "questions": questions_with_results,
            "wrongQuestions": wrong_questions
        }
    
    # Not completed
    questions_for_user = []
    for tq in tqs:
        opts = [o.body for o in sorted(tq.question.options, key=lambda o: o.sort_order)]
        questions_for_user.append({
            "question": tq.question.body,
            "options": opts
        })
        
    return {
        "id": test.id,
        "topic_name": test.title.replace("Quiz: ", ""),
        "question_count": len(tqs),
        "questions": questions_for_user,
        "status": "ready"
    }


@router.get("/user/{user_id}/results")
async def get_user_results(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TestSession).where(
            TestSession.student_id == user_id, 
            TestSession.status == SessionStatusEnum.completed
        ).options(selectinload(TestSession.test).selectinload(Test.test_questions))
    )
    sessions = result.scalars().all()
    
    return [
        {
            "id": s.test_id,
            "topic_name": s.test.title.replace("Quiz: ", "") if s.test else "Unknown",
            "score": s.total_score,
            "total": len(s.test.test_questions) if s.test else 0,
            "percentage": s.percentage,
            "completed_at": None # You can add `completed_at` to TestSession model in future
        }
        for s in reversed(sessions)
    ]

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar() or 0
    
    # Sessiyalarni foydalanuvchi ma'lumotlari bilan birga yuklash
    result = await db.execute(
        select(TestSession)
        .where(TestSession.status == SessionStatusEnum.completed)
        .options(
            selectinload(TestSession.test).selectinload(Test.test_questions),
            selectinload(TestSession.student)
        )
    )
    sessions = result.scalars().all()
    
    total_quizzes = len(sessions)
    average_score = sum(s.percentage for s in sessions if s.percentage) / total_quizzes if total_quizzes else 0
    
    top_scores = [
        {
            "user_id": s.student_id,
            "topic": s.test.title.replace("Quiz: ", "") if s.test else "Noma'lum",
            "score": s.total_score or 0,
            "total": len(s.test.test_questions) if s.test else 0,
            "percentage": s.percentage or 0,
            "user_name": s.student.name if s.student else f"User #{s.student_id}"
        }
        for s in sorted(sessions, key=lambda x: x.percentage or 0, reverse=True)[:10]
    ]
    
    return DashboardStats(
        total_quizzes=total_quizzes,
        total_users=total_users,
        average_score=round(average_score, 1),
        top_scores=top_scores
    )

@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT id, name, icon, color, description FROM categories ORDER BY id"))
    return [{"id":r[0],"name":r[1],"icon":r[2],"color":r[3],"description":r[4]} for r in result.fetchall()]

@router.get("/books", response_model=list[BookWithCategory])
async def get_books(category_id: int = None, db: AsyncSession = Depends(get_db)):
    q = "SELECT b.id, b.category_id, b.title, b.author, b.description, b.level, b.pages, b.cover_image, c.name, b.pdf_path FROM books b LEFT JOIN categories c ON b.category_id = c.id ORDER BY b.title"
    if category_id:
        q = q.replace("ORDER BY", f"WHERE b.category_id = {category_id} ORDER BY")
    result = await db.execute(text(q))
    return [{"id":r[0],"category_id":r[1],"title":r[2],"author":r[3],"description":r[4],"level":r[5],"pages":r[6],"cover_image":r[7],"category_name":r[8],"pdf_path":r[9] if len(r)>9 else None} for r in result.fetchall()]

@router.post("/quiz-recommendations")
async def get_quiz_recommendations(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Test).where(Test.id == quiz_id).options(
            selectinload(Test.sessions).selectinload(TestSession.answers),
            selectinload(Test.test_questions).selectinload(TestQuestion.question)
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
        
    sessions = [s for s in test.sessions if s.status == SessionStatusEnum.completed]
    if not sessions:
        raise HTTPException(status_code=400, detail="Quiz hali yakunlanmagan")
    latest_session = sorted(sessions, key=lambda x: x.id, reverse=True)[0]
    
    wrong_questions = []
    answers_dict = {ans.question_id: ans for ans in latest_session.answers}
    for tq in test.test_questions:
        ans_record = answers_dict.get(tq.question.id)
        if ans_record and not ans_record.is_correct:
            wrong_questions.append({
                "question": tq.question.body
            })
            
    # Simplified AI logic for wrong questions
    try:
        recommendations = await quiz_ai.get_recommendations(
            topic_name=test.title,
            score=latest_session.total_score,
            total=len(test.test_questions),
            wrong_questions=wrong_questions
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI tavsiyalar olishda xatolik: {str(e)[:100]}")

@router.post("/upload-questions-csv")
async def upload_questions_csv(
    subject_name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    author_id: int = Form(1)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Faqat .csv fayllar qabul qilinadi")
        
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    # Subject lookup
    result = await db.execute(select(Subject).where(Subject.name == subject_name))
    subject = result.scalar_one_or_none()
    if not subject:
        subject = Subject(name=subject_name, description=f"{subject_name} fanidan bazaga kiritilgan materiallar")
        db.add(subject)
        await db.flush()
        
    topic_cache = {}
    question_count = 0
    
    for row in csv_reader:
        topic_name = row['topic'].strip()
        if topic_name not in topic_cache:
            result = await db.execute(select(Topic).where(Topic.subject_id == subject.id, Topic.name == topic_name))
            topic = result.scalar_one_or_none()
            if not topic:
                topic = Topic(subject_id=subject.id, name=topic_name)
                db.add(topic)
                await db.flush()
            topic_cache[topic_name] = topic.id
            
        topic_id = topic_cache[topic_name]
        
        try: diff_level = int(row['difficulty_level'])
        except: diff_level = 1
            
        question = Question(
            topic_id=topic_id,
            author_id=author_id,
            body=row['question'].strip(),
            explanation=row['explanation'].strip(),
            difficulty_level=diff_level,
            bloom_level=row['bloom_level'].strip(),
            is_ai_generated=False
        )
        db.add(question)
        await db.flush()
        
        correct_letter = row['correct_option'].strip().upper()
        options_data = [
            ('A', row['option_a'].strip()),
            ('B', row['option_b'].strip()),
            ('C', row['option_c'].strip()),
            ('D', row['option_d'].strip())
        ]
        
        for idx, (letter, text) in enumerate(options_data):
            if text:
                opt = QuestionOption(
                    question_id=question.id, body=text,
                    is_correct=(letter == correct_letter), sort_order=idx
                )
                db.add(opt)
                
        question_count += 1
        
    await db.commit()
    return {"status": "success", "message": f"{question_count} ta savol yuklandi."}


