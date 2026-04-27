import asyncio
import csv
import sys
import os
from dotenv import load_dotenv

# backend papkasini pathga qo'shish
sys.path.append(os.path.join(os.getcwd(), "backend"))

# .env yuklash
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.core.database import async_session
from app.models.models import Subject, Topic, Question, QuestionOption, User
from sqlalchemy import select

async def import_csv(file_path):
    async with async_session() as db:
        # 1. Userni olish (Admin yoki birinchi user)
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        if not user:
            print("Xato: Bazada foydalanuvchi yo'q")
            return

        if not os.path.exists(file_path):
            print(f"Xato: Fayl topilmadi: {file_path}")
            return

        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            subject_cache = {}
            topic_cache = {}
            count = 0
            
            for row in reader:
                subj_name = row['subject'].strip()
                if subj_name not in subject_cache:
                    res = await db.execute(select(Subject).where(Subject.name == subj_name))
                    subj = res.scalar_one_or_none()
                    if not subj:
                        subj = Subject(name=subj_name, description=f"{subj_name} dasturlash tili bo'yicha savollar")
                        db.add(subj)
                        await db.flush()
                    subject_cache[subj_name] = subj.id
                
                subj_id = subject_cache[subj_name]
                
                topic_name = row['topic'].strip()
                topic_key = f"{subj_id}_{topic_name}"
                if topic_key not in topic_cache:
                    res = await db.execute(select(Topic).where(Topic.subject_id == subj_id, Topic.name == topic_name))
                    topic = res.scalar_one_or_none()
                    if not topic:
                        topic = Topic(subject_id=subj_id, name=topic_name)
                        db.add(topic)
                        await db.flush()
                    topic_cache[topic_key] = topic.id
                
                topic_id = topic_cache[topic_key]
                
                # Question yaratish
                try: diff = int(row.get('difficulty_level', 1))
                except: diff = 1
                
                question = Question(
                    topic_id=topic_id,
                    author_id=user.id,
                    body=row['question'].strip(),
                    explanation=row['explanation'].strip(),
                    difficulty_level=diff,
                    bloom_level=row.get('bloom_level', 'remember'),
                    is_ai_generated=False
                )
                db.add(question)
                await db.flush()
                
                # Options yaratish
                correct_letter = row['correct_option'].strip().upper()
                options_data = [
                    ('A', row['option_a'].strip()),
                    ('B', row['option_b'].strip()),
                    ('C', row['option_c'].strip()),
                    ('D', row['option_d'].strip())
                ]
                
                for idx, (letter, text) in enumerate(options_data):
                    if text:
                        db.add(QuestionOption(
                            question_id=question.id,
                            body=text,
                            is_correct=(letter == correct_letter),
                            sort_order=idx
                        ))
                
                count += 1
                if count % 20 == 0:
                    print(f"Yuklandi: {count} ta savol...")
            
            await db.commit()
            print(f"Muvaffaqiyatli tugallandi! Jami: {count} ta C++ savoli kiritildi.")

if __name__ == "__main__":
    csv_path = "/Users/admin/Downloads/cpp_100_questions.csv"
    asyncio.run(import_csv(csv_path))
