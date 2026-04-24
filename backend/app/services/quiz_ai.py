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
        # 1-QADAM: AI foydalanuvchi niyatini tushunadi (Semantic normalization)
        # Masalan: "pyton" -> "Python", "funsiyalar" -> "functions"
        refined_topic = topic_name
        if settings.GROQ_API_KEY:
            try:
                # Oddiy prompt orqali niyatni aniqlash
                intent_prompt = f"Foydalanuvchi yozgan ushbu mavzu nomini to'g'rilang va asosiy kalit so'zlarni chiqaring: '{topic_name}'. Faqat to'g'rilangan nomni yozing."
                refined_topic = await self._call_groq(intent_prompt)
                refined_topic = refined_topic.strip().split('\n')[0]
            except:
                refined_topic = topic_name

                    # 2-QADAM: Bazadan (MySQL) ushbu to'g'rilangan mavzuga doir fan/mavzu borligini tekshirish
        kb_context = ""
        db_questions_list = []
        is_valid_subject = False
        if db:
            from sqlalchemy import select, or_
            from app.models.models import Question, Topic, Subject, QuestionOption
            from sqlalchemy.orm import selectinload
            
            search_terms = refined_topic.split()
            
            # Check if subject/topic exists in DB
            subject_filters = [Subject.name.ilike(f"%{term}%") for term in search_terms]
            topic_filters = [Topic.name.ilike(f"%{term}%") for term in search_terms]
            
            valid_check = await db.execute(
                select(Topic).join(Subject).where(or_(*subject_filters, *topic_filters)).limit(1)
            )
            is_valid_subject = valid_check.scalars().first() is not None
            
            # Kalit so'zlar bo'yicha qidirish (murakkabroq qidiruv)
            filters = [Topic.name.ilike(f"%{term}%") for term in search_terms] + \
                      [Question.body.ilike(f"%{term}%") for term in search_terms]
            
            result = await db.execute(
                select(Question).join(Topic).options(selectinload(Question.options))
                .where(or_(*filters)).limit(50)
            )
            db_questions = result.scalars().all()
            
            if db_questions:
                kb_context = "\\n\\nBAZADAGI MAVJUD SAVOLLAR (BULARDAN FOYDALANING):\\n"
                for i, q in enumerate(db_questions, 1):
                    opts = [opt.body for opt in sorted(q.options, key=lambda x: x.sort_order)]
                    correct_idx = next((idx for idx, opt in enumerate(q.options) if opt.is_correct), 0)
                    db_questions_list.append({
                        "question": q.body,
                        "options": opts,
                        "correct_answer": correct_idx,
                        "explanation": q.explanation or ""
                    })
                    kb_context += f"- Savol: {q.body}\\n"

        # 3-QADAM: Bazada ma'lumot borligini tekshirish
        if not is_valid_subject and not topic_content:
            raise Exception(f"Kechirasiz, ushbu fan ('{refined_topic}') hozircha bilimlar bazasida mavjud emas. Iltimos, bazaga yuklangan fanlardan foydalaning (masalan: Python).")

        # 4-QADAM: AI savollarni bazaga tayanib yoki o'xshatib tuzadi
        prompt = self._build_quiz_prompt(refined_topic, topic_content, question_count, difficulty, kb_context)
        
        if settings.USE_OLLAMA:
            content = await self._call_ollama(prompt)
        elif settings.USE_GROQ and settings.GROQ_API_KEY:
            try:
                content = await self._call_groq(prompt)
            except Exception as e:
                print(f"Groq xatolik (limit): {e}")
                if db_questions_list:
                    import random
                    return random.sample(db_questions_list, min(question_count, len(db_questions_list)))
                else:
                    raise Exception(f"AI API xatolik yuz berdi va bazada muqobil savollar yo'q. Xato: {str(e)}")
        else:
            if db_questions_list:
                import random
                return random.sample(db_questions_list, min(question_count, len(db_questions_list)))
            raise Exception("AI ishlashi uchun API key kerak yoki bazada ma'lumot yo'q.")
        
        questions = self._parse_quiz(content, question_count)
        
        # Agarda AI xato qilsa yoki kam savol bersa, bazadagi savollardan qo'shib to'ldiramiz
        if len(questions) < question_count and db_questions_list:
            for db_q in db_questions_list:
                if len(questions) >= question_count: break
                if not any(q['question'] == db_q['question'] for q in questions):
                    questions.append(db_q)
                    
        if not questions:
            raise Exception("AI savol tuza olmadi yoki API kalit ishlamayapti. Iltimos, qaytadan urinib ko'ring yoki boshqa mavzu tanlang.")
            
        return questions[:question_count]

    def _build_quiz_prompt(self, topic_name: str, topic_content: str, question_count: int, difficulty: str = "medium", kb_context: str = "") -> str:
        import re
        cleaned_content = topic_content
        if cleaned_content:
            # Remove all image references and data URLs
            cleaned_content = re.sub(r'https?://[^\s]*\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico)[^\s]*', '[Rasm o\'chirildi]', cleaned_content, flags=re.IGNORECASE)
            cleaned_content = re.sub(r'/[^\s]*\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|pdf)[^\s]*', '[Fayl o\'chirildi]', cleaned_content, flags=re.IGNORECASE)
            cleaned_content = re.sub(r'\\\\[^\\]*\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|pdf)[^\\]*', '[Fayl o\'chirildi]', cleaned_content, flags=re.IGNORECASE)
            cleaned_content = re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', '[Rasm o\'chirildi]', cleaned_content)
            cleaned_content = re.sub(r'data:application/[^;]+;base64,[A-Za-z0-9+/=]+', '[Fayl o\'chirildi]', cleaned_content)
            # Remove any remaining data URLs
            cleaned_content = re.sub(r'data:[^;]+;base64,[A-Za-z0-9+/=]+', '[Ma\'lumot o\'chirildi]', cleaned_content)
            cleaned_content = cleaned_content[:1000]
         
        info = f"\n\nMavzu haqida qo'shimcha ma'lumot:\n{cleaned_content}" if cleaned_content.strip() else ""
         
        return f'''Mavzu: {topic_name}
{kb_context}
{info}

QOIDALAR:
1. Har bir savol ANIQ bo'lsin (1-2 gap)
2. Har bir savolga 4 TA XILI JAVOB bering (A, B, C, D)
3. "Birinchi javob", "Ikkinchi javob" YOZMAYING!
4. JAVOB HARFI (A, B, C yoki D) HAR DOIM YOZILISHI SHART!
5. Dasturlash: har 5 tadan 1 AMALIY (kod natijasi), 4 NAZARIY
6. Dasturlash EMAS: faqat NAZARIY, KOD YOK

FORMAT (BU SHABLONGGA TEKIS QILING):
Q: Python da OOP ning 4 ta asosiy tamoyili nima?
A) Inkapsulyatsiya
B) Meros
C) Polimorfizm
D) Abstraksiya
A

Q: print("Python"[::-1]) - nima chiqadi?
A) Python
B) nohtyP
C) P
D) ython
B

Q: Nyutonning ikkinchi qonuni qanday ifodalanadi?
A) F = ma
B) E = mc^2
C) V = IR
D) P = IV
A

Q: O'zbekiston mustaqillikka qachon erishgan?
A) 1990-yil 31-avgust
B) 1991-yil 31-avgust
C) 1992-yil 1-sentabr
D) 1991-yil 1-sentabr
B

{question_count} ta SAVOL YARATING - SHU FORMATGA TO'LIQ VA TEKIS QILING! HAR BIR SAVOL RAQAMLANMASIN, FAQAT Q: BILAN BOSHLANSIN. SAVOLLAR SONI ANIQ {question_count} TA BO'LSIN!'''

    async def _call_ollama(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.5,
                        "num_predict": 5000
                    }
                }
            )
            return response.json().get("response", "")

    async def _call_groq(self, prompt: str) -> str:
        if not settings.GROQ_API_KEY:
            raise Exception("Groq API key topilmadi. Iltimos, .env faylini yoki Render sozlamalarini tekshiring.")
            
        import asyncio
        max_retries = 3
        for attempt in range(max_retries):
            async with httpx.AsyncClient(timeout=180.0) as client:
                try:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "llama3-8b-8192",
                            "messages": [
                                {"role": "system", "content": "Siz O'zbek tilida quiz savollari yaratuvchi AI siz. Har bir savoldan keyin to'g'ri javobni A, B, C yoki D harfi bilan yozing."},
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.5,
                            "max_tokens": 4096
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"]
                    
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            await asyncio.sleep(2 ** attempt) # Exponential backoff
                            continue
                        raise Exception("Groq limitga uchradi (Rate limit). Iltimos, 1 daqiqa kuting.")
                    
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", str(error_data))
                    raise Exception(f"Groq API xatolik: {error_msg}")
                    
                except Exception as e:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
                        continue
                    raise e

    async def _call_grok(self, prompt: str) -> str:
        if not settings.OPENAI_API_KEY:
            raise Exception("OpenAI/Grok API key topilmadi. Iltimos, .env faylini tekshiring.")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "grok-2",
                    "messages": [
                        {"role": "system", "content": "Siz O'zbek tilida quiz savollari yaratuvchi AI siz."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4000
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def _parse_quiz(self, content: str, expected_count: int) -> List[Dict[str, Any]]:
        result = []
        content = content.strip()
        
        # Remove markdown code blocks
        content = re.sub(r'```python\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        content = re.sub(r'`([^`]+)`', r'\1', content)
        
        # Remove prefixes
        content = re.sub(r'(NAZARIY|AMALIY|NAZARIY SAVOL|AMALIY SAVOL)\s*:\s*', '', content, flags=re.IGNORECASE)
        
        # Remove intro text
        content = re.sub(r'^.*?(?:savolni|tayyorladim|quiz|tayyorladim)[:\.]?\s*(?=\d+\.\s*Q:)', '', content, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove leading numbers like "1. " from the beginning of lines
        content = re.sub(r'^(\d+)[\.\)]\s*', '', content, flags=re.MULTILINE)
        
        # Split by Q: patterns
        blocks = re.split(r'\n(?=Q:)', content, flags=re.IGNORECASE)
        
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            
            # Extract question - from Q: to first option A)
            q_match = re.search(r'(?:Q:|Savol\s*\d*:)\s*(.+?)(?=\n\s*[A-D][\.\)\:])', block, re.IGNORECASE | re.DOTALL)
            if not q_match:
                continue
            
            question = q_match.group(1).strip()
            question = re.sub(r'\s+', ' ', question)
            if not question or len(question) < 5:
                continue
            
            if not question.endswith('?'):
                question += '?'
            
            # Extract options - find A), B), C), D) with their text
            option_pattern = r'([A-D])[\.\)\:]\s*(.+?)(?=\n\s*[A-D][\.\)\:]|\s*[A-D]\s*[Jj]avob|\s*$|$)'
            options = []
            for match in re.finditer(option_pattern, block, re.DOTALL):
                letter, opt_text = match.groups()
                opt_text = opt_text.strip()
                # Clean up any extra text like "A Javob: To'g'ri javob"
                opt_text = re.sub(r'\s*[A-Z]\s*[Jj]avob:.*$', '', opt_text)
                opt_text = re.sub(r'\s*\([^)]*javob[^)]*\)\s*.*$', '', opt_text, flags=re.IGNORECASE)
                opt_text = re.sub(r'\s+', ' ', opt_text)
                if opt_text and len(opt_text) > 1:  # Avoid empty or single character options
                    options.append((letter, opt_text))
            
            if len(options) < 4:
                continue
            
            # Find correct answer - look for standalone A/B/C/D at end of block
            correct_letter = None
            lines = block.strip().split('\n')
            for line in reversed(lines):
                line = line.strip()
                if re.match(r'^[A-D]$', line, re.I):
                    correct_letter = line.upper()
                    break
            
            if not correct_letter:
                continue
            
            # Convert letter to index
            correct_index = 0
            for i, (letter, _) in enumerate(options):
                if letter == correct_letter:
                    correct_index = i
                    break
            
            result.append(self._create_question(question, options, correct_index))
        
        return result

    def _create_question(self, question: str, options: List, correct_index: int) -> Dict[str, Any]:
        clean_options = [opt[1] for opt in options[:4]]
        
        while len(clean_options) < 4:
            clean_options.append(f"Qo'shimcha variant {len(clean_options) + 1}")
        
        return {
            "question": question[:300] if len(question) > 300 else question,
            "options": clean_options,
            "correct_answer": correct_index if correct_index < 4 else 0,
            "explanation": ""
        }

    async def get_recommendations(self, topic_name: str, score: int, total: int, wrong_questions: list) -> str:
        percentage = (score / total * 100) if total > 0 else 0
        
        wrong_summary = []
        for i, q in enumerate(wrong_questions[:5], 1):
            wrong_summary.append(f"{i}. {q.get('question', 'Savol')}")
        
        prompt = f'''Siz o'qituvchi va murabbiy bo'lib ishlaysiz.

Test natijasi:
- Mavzu: {topic_name}
- To'g'ri javoblar: {score}/{total} ({percentage:.0f}%)
- Noto'g'ri javoblar soni: {len(wrong_questions)}

Noto'g'ri javob berilgan savollar:
{chr(10).join(wrong_summary) if wrong_summary else "Yo'q"}

Vazifa: Quyidagi 3 qismda javob bering:

1. MAVZU TAHLILI: Bu mavzuni qay darajada o'zlashtirganini baholang va nega bu xatolarni qilgan bo'lishi mumkinligini tushuntiring.

2. TAKRORLASH TAVSIYALARI: Qaysi aniq boblar yoki mavzularni takrorlash kerak? Minimal 3 ta konkret tavsiya bering.

3. O'RGANISH METODI: Bu mavzuni samarali o'rganish uchun qanday metodlardan foydalanish kerak? (masalan: карточкалар, тестлар, видео дарслар, амалиёт ва х.к.)

Javoblarni O'zbek tilida, ixcham va foydali qilib yozing.'''

        if settings.USE_GROQ and settings.GROQ_API_KEY:
            return await self._call_groq(prompt)
        elif settings.USE_GROK and settings.OPENAI_API_KEY:
            return await self._call_grok(prompt)
        elif settings.USE_OLLAMA:
            return await self._call_ollama(prompt)
        else:
            return await self._call_groq(prompt)

quiz_ai = QuizAI()