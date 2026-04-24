# AI Quiz Master

AI yordamida bilimlaringizni tekshiring va rivojlantiring.

## Texnologiyalar

- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Python FastAPI
- **Database:** MySQL
- **AI:** Groq API (Llama 3.3)

## Ishga tushirish

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# yoki venv\Scripts\activate  # Windows
pip install -r requirements.txt

# .env faylini yarating
cp .env.example .env
# .env fayliga o'z ma'lumotlaringizni yozing

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Vazifalar

- [x] Foydalanuvchi ro'yxatdan o'tish va login
- [x] Kitoblar bo'limi (PDFlar bilan)
- [x] AI tomonidan test yaratish
- [x] 4 ta qiyinlik darajasi (easy, medium, hard, expert)
- [x] Natijalar va tavsiyalar
- [x] Dark/Light theme
- [x] Statistika

## Licensed

MIT