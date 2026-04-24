import asyncio
from app.models.models import StudentProfileStats

async def main():
    stats = StudentProfileStats(user_id=1)
    print(stats.total_quizzes_taken)

asyncio.run(main())
