import os
import json
import re
import httpx
from typing import List, Dict, Any
from app.core.config import settings

class QuizAI:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.2")

    async def generate_quiz(self, topic_name: str, topic_content: str, question_count: int, difficulty: str = "medium", db=None) -> List[Dict[str, Any]]:
        refined_topic = topic_name
        # Agar matn berilgan bo'lsa, mavzuni qayta ishlash shart emas, u chalkashlikka olib kelishi mumkin
        if settings.GROQ_API_KEY and not topic_content:
            try:
                intent_prompt = f"Foydalanuvchi yozgan ushbu mavzu nomini to'g'rilang: '{topic_name}'. Faqat to'g'rilangan nomni yozing."
                refined_topic = await self._call_groq(intent_prompt)
                refined_topic = refined_topic.strip().split('\n')[0].replace('"', '').replace("'", "")
            except:
                refined_topic = topic_name

        kb_context = ""
        db_questions_list = []
        is_valid_subject = False
        if db:
            try:
                from sqlalchemy import select, or_
                from app.models.models import Question, Topic, Subject
                from sqlalchemy.orm import selectinload
                
                search_terms = refined_topic.split()
                subject_filters = [Subject.name.ilike(f"%{term}%") for term in search_terms]
                topic_filters = [Topic.name.ilike(f"%{term}%") for term in search_terms]
                
                valid_check = await db.execute(
                    select(Topic).join(Subject).where(or_(*subject_filters, *topic_filters)).limit(1)
                )
                is_valid_subject = valid_check.scalars().first() is not None
                
                filters = [Topic.name.ilike(f"%{term}%") for term in search_terms] + \
                          [Question.body.ilike(f"%{term}%") for term in search_terms]
                
                result = await db.execute(
                    select(Question).join(Topic).options(selectinload(Question.options))
                    .where(or_(*filters)).limit(20)
                )
                db_questions = result.scalars().all()
                
                if db_questions:
                    kb_context = "\n\nBAZADAGI NAMUNA SAVOLLAR:\n"
                    for q in db_questions:
                        opts = [opt.body for opt in sorted(q.options, key=lambda x: x.sort_order)]
                        correct_idx = next((idx for idx, opt in enumerate(q.options) if opt.is_correct), 0)
                        db_questions_list.append({
                            "question": q.body,
                            "options": opts,
                            "correct_answer": correct_idx,
                            "explanation": q.explanation or ""
                        })
                        kb_context += f"- {q.body}\n"
            except Exception as e:
                print(f"DB Error in AI service: {e}")

        prompt = self._build_quiz_prompt(refined_topic, topic_content, question_count, difficulty, kb_context)
        
        print(f"DEBUG: Generating quiz for: {refined_topic}")
        
        content = ""
        if settings.USE_GROQ and settings.GROQ_API_KEY:
            try:
                content = await self._call_groq(prompt)
            except Exception as e:
                print(f"Groq Error: {e}")
                if db_questions_list:
                    import random
                    return random.sample(db_questions_list, min(question_count, len(db_questions_list)))
                raise e
        elif settings.USE_OLLAMA:
            content = await self._call_ollama(prompt)
        else:
            if db_questions_list:
                import random
                return random.sample(db_questions_list, min(question_count, len(db_questions_list)))
            raise Exception("AI API key topilmadi.")
        
        questions = self._parse_quiz(content, question_count)
        
        if not questions:
            print(f"DEBUG: AI RAW CONTENT:\n{content}")
            # Agar birinchi marta o'xshamasab, qaytadan (soddaroq) urinib ko'ramiz
            if topic_content:
                 retry_prompt = f"Quyidagi matn asosida {question_count} ta test savoli tuzing. Faqat savol, variantlar va to'g'ri javob harfini yozing. Matn: {topic_content[:1000]}"
                 try:
                     content = await self._call_groq(retry_prompt)
                     questions = self._parse_quiz(content, question_count)
                 except: pass

        if not questions:
            raise Exception("AI savol tuza olmadi. Iltimos, materialni qisqartirib yoki mavzu nomini aniqlashtirib qaytadan urinib ko'ring.")
            
        return questions[:question_count]

    def _build_quiz_prompt(self, topic_name: str, topic_content: str, question_count: int, difficulty: str = "medium", kb_context: str = "") -> str:
        cleaned_content = topic_content[:4000] if topic_content else ""
        
        info = f"\n\nMANBA MATNI (SAVOLLAR FAQAT SHUNDAN BO'LSIN):\n{cleaned_content}" if cleaned_content else ""
        
        return f'''Vazifa: {topic_name} mavzusida {question_count} ta test savoli tuzing.
{kb_context}
{info}

QOIDALAR:
1. FAQAT O'zbek tilida yozing.
2. Har bir savol Q: harfi bilan boshlansin.
3. 4 ta variant (A, B, C, D) bo'lsin.
4. To'g'ri javob harfi variantlardan keyin alohida qatorda yozilsin.
5. Qiyinlik darajasi: {difficulty}.
6. Agarda MANBA MATNI berilgan bo'lsa, FAQAT o'sha matndagi ma'lumotlardan foydalaning!

FORMAT NAMUNASI:
Q: C# da 'int' nima?
A) Butun son
B) Matn
C) Mantiqiy qiymat
D) Hech narsa
A

Savollarni boshlang:'''

    async def _call_groq(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}"},
                json={
                    "model": "llama-3.1-70b-versatile", # Kuchliroq modelga o'tdik
                    "messages": [
                        {"role": "system", "content": "Siz tajribali o'qituvchi va test tuzuvchisiz. AGAR 'MANBA MATNI' berilsa, FAQAT va FAQAT o'sha matndan foydalaning. O'zingizning tashqi bilimingizni (masalan, dasturlash) umuman qo'shmang. Matndagi ma'lumotlar asosida savol tuzing."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3, # Aniqroq javob uchun
                    "max_tokens": 4096
                }
            )
            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.text}")
            return response.json()["choices"][0]["message"]["content"]

    async def _call_ollama(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(f"{self.ollama_url}/api/generate", json={"model": self.model, "prompt": prompt, "stream": False})
            return response.json().get("response", "")

    def _parse_quiz(self, content: str, expected_count: int) -> List[Dict[str, Any]]:
        result = []
        content = "\n" + content.strip()
        blocks = re.split(r'\n\s*(?=Q:|Savol:)', content, flags=re.IGNORECASE)
        
        for block in blocks:
            block = block.strip()
            if not block: continue
            
            q_match = re.search(r'(?:Q:|Savol:)\s*(.+?)(?=\n\s*[A-D][\.\)\:])', block, re.IGNORECASE | re.DOTALL)
            if not q_match: continue
            question = q_match.group(1).strip()
            
            option_pattern = r'([A-D])[\.\)\:]\s*(.+?)(?=\n\s*[A-D][\.\)\:]|\s*[A-D]\s*javob|\n\s*[A-D]\s*$|\s*$)'
            options = []
            for match in re.finditer(option_pattern, block, re.IGNORECASE | re.DOTALL):
                letter, opt_text = match.groups()
                options.append((letter.upper(), opt_text.strip()))
            
            if len(options) < 4: continue
            
            correct_letter = None
            lines = block.split('\n')
            for line in reversed(lines):
                line = line.strip()
                ans_match = re.search(r'(?:To\'g\'ri javob|Javob|Answer|Correct)?[:\s]*([A-D])(?:\s|$|\.)', line, re.I)
                if ans_match:
                    correct_letter = ans_match.group(1).upper()
                    break
            
            if not correct_letter: continue
            
            correct_index = 0
            for i, (letter, _) in enumerate(options):
                if letter == correct_letter:
                    correct_index = i
                    break
            
            result.append({"question": question, "options": [opt[1] for opt in options[:4]], "correct_answer": correct_index, "explanation": ""})
        
        return result

    async def get_recommendations(self, topic_name: str, score: int, total: int, wrong_questions: list) -> str:
        prompt = f"Mavzu: {topic_name}\nNatija: {score}/{total}. Tavsiya bering."
        try: return await self._call_groq(prompt)
        except: return "Yaxshi natija!"

quiz_ai = QuizAI()