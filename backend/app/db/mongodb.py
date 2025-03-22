from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

client: Optional[AsyncIOMotorClient] = None
database: Optional[AsyncIOMotorDatabase] = None

async def connect_to_mongo():
    global client, database
    if client is None:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.MONGODB_DB_NAME]
        # Create indexes
        await create_indexes()

async def close_mongo_connection():
    global client
    if client:
        client.close()
        client = None

def get_database() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database

async def create_indexes():
    db = get_database()
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    
    # Resumes collection indexes
    await db.resumes.create_index("user_id")
    await db.resumes.create_index("status")
    
    # Interviews collection indexes
    await db.interviews.create_index("user_id")
    await db.interviews.create_index("role_id")
    await db.interviews.create_index("status")
    await db.interviews.create_index([("start_time", -1)])
    
    # Questions collection indexes
    await db.questions.create_index("interview_id")
    await db.questions.create_index([("type", 1), ("difficulty", 1)])
    
    # Answers collection indexes
    await db.answers.create_index("question_id")
    
    # Roles collection indexes
    await db.roles.create_index([("category", 1), ("specialization", 1)])
    await db.roles.create_index("experience_level")

# Helper functions for CRUD operations
async def insert_one(collection: str, document: dict):
    db = get_database()
    result = await db[collection].insert_one(document)
    return result.inserted_id

async def find_one(collection: str, query: dict):
    db = get_database()
    return await db[collection].find_one(query)

async def find_many(collection: str, query: dict, limit: int = 0):
    db = get_database()
    cursor = db[collection].find(query)
    if limit > 0:
        cursor = cursor.limit(limit)
    return await cursor.to_list(None)

async def update_one(collection: str, query: dict, update: dict):
    db = get_database()
    result = await db[collection].update_one(query, {"$set": update})
    return result.modified_count

async def delete_one(collection: str, query: dict):
    db = get_database()
    result = await db[collection].delete_one(query)
    return result.deleted_count

async def aggregate(collection: str, pipeline: list):
    db = get_database()
    return await db[collection].aggregate(pipeline).to_list(None) 