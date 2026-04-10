import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "AI-TestMaster"
    DEBUG: bool = True
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_test.db"
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    USE_OLLAMA: bool = False
    USE_GROK: bool = False
    USE_GROQ: bool = True
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    
    TEST_WORKSPACE: str = "./test_workspace"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
