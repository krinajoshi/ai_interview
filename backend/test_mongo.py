import asyncio
from app.db.mongodb import get_database

async def test():
    db = get_database()
    print('Testing MongoDB connection...')
    user = await db.users.find_one({})
    print(f'User: {user}')

if __name__ == "__main__":
    asyncio.run(test()) 