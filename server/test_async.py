import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    try:
        engine = create_async_engine("postgresql://postgres:postgres@localhost/db")
        print("Engine created successfully")
    except Exception as e:
        print(f"Error: {repr(e)}")

asyncio.run(main())
