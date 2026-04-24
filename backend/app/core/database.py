import ssl
from urllib.parse import urlparse, parse_qs
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Aiven kabi bulutli xizmatlarda SSL talab etiladi. URL orqali kelganda uni to'g'ri qayta ishlash:
db_url = settings.DATABASE_URL
connect_args = {}

if "ssl_mode=REQUIRED" in db_url or "ssl=true" in db_url:
    db_url = db_url.replace("?ssl_mode=REQUIRED", "").replace("?ssl=true", "")
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

engine = create_async_engine(db_url, echo=settings.DEBUG, connect_args=connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
