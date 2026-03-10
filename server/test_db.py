import asyncio
import sys
from app.database import engine
from app.models import Base

async def test_conn():
    print("Starting test_conn...")
    try:
        async with engine.begin() as conn:
            print("Engine begin successful.")
            await conn.run_sync(Base.metadata.create_all)
            print("create_all successful.")
    except Exception as e:
        print(f"Exception: {repr(e)}")
    print("Test conn finished.")

if __name__ == "__main__":
    asyncio.run(test_conn())
