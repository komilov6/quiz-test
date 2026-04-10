from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import router
from app.core.database import init_db
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="AI Quiz Master",
    description="AI bilan bilimlarni tekshirish tizimi",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "books")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads/books", StaticFiles(directory=uploads_dir), name="books")

@app.get("/")
async def root():
    return {
        "name": "AI Quiz Master",
        "version": "1.0.0",
        "description": "AI bilan bilimlarni tekshirish tizimi",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
