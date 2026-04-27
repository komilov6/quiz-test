import ssl
from urllib.parse import urlparse, parse_qs
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Aiven kabi bulutli xizmatlarda SSL talab etiladi.
db_url = settings.DATABASE_URL
connect_args = {}

parsed_url = urlparse(db_url)
query_params = parse_qs(parsed_url.query)

# SSL talab qilinishini aniqlash (Aiven xostlari uchun avtomatik yoki parametr orqali)
is_ssl_required = (
    "ssl_mode" in query_params or 
    "ssl-mode" in query_params or
    "ssl" in query_params or 
    (parsed_url.hostname and "aivencloud.com" in parsed_url.hostname)
)

if is_ssl_required:
    # URL dan SSL parametrlarini olib tashlash (sqlalchemy/aiomysql uchun connect_args orqali beramiz)
    new_query = "&".join([f"{k}={v[0]}" for k, v in query_params.items() if k not in ["ssl_mode", "ssl-mode", "ssl"]])
    # URL ni qayta yig'ish
    db_url = parsed_url._replace(query=new_query).geturl()
    
    # SSL context yaratish
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
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {str(e)}")
        # Xatoni qayta ko'tarish (startup fail bo'lishi uchun)
        raise e
