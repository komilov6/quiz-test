# AI-TestMaster

AI asosida avtomatlashtirilgan test tizimi

## Texnologiyalar

- **Backend:** Python FastAPI + SQLAlchemy
- **Frontend:** React + TypeScript + TailwindCSS
- **AI:** Ollama (bepul mahalliy LLM) yoki OpenAI GPT-4
- **Ma'lumotlar bazasi:** SQLite (ishlab chiqish) / PostgreSQL (ishlab chiqarish)

## Imkoniyatlari

- Tabiiy tildan test yaratish (NL → Code)
- Python, JavaScript, Java, TypeScript support
- Testlarni avtomatik bajarish
- Natijalarni tahlil qilish va vizualizatsiya
- Dashboard va hisobotlar

## Ishga tushirish

### Docker bilan (tavsiya etiladi)

```bash
# Ollama ni o'rnating
# macOS/Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Modelni yuklab oling
ollama pull llama3.2

# Ollama ni ishga tushiring
ollama serve

# Loyihani ishga tushiring
docker-compose up -d
```

### Qo'lda

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Sozlash

`backend/` papkasida `.env` faylini yarating:
```
USE_OLLAMA=true
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Boshqa bepul modellar: `mistral`, `codellama`, `phi3`

## API Endpoints

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/api/v1/generate-tests` | AI bilan test yaratish |
| POST | `/api/v1/run-tests` | Testlarni bajarish |
| GET | `/api/v1/dashboard/stats` | Dashboard statistika |
| POST | `/api/v1/analyze-code` | Kodni tahlil qilish |

## Foydalanish

1. `http://localhost:3000` sahifasini oching
2. "Generate Tests" bo'limiga o'ting
3. Test qilish kerak bo'lgan funksionallikni tavsiflang
4. "Generate Tests with AI" tugmasini bosing
5. Natijalarni ko'ring va testlarni ishga tushiring

## Litsenziya

MIT
