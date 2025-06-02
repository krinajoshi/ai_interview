import motor.motor_asyncio
from pymongo import MongoClient
from pymongo.database import Database
import os

from app.core.config import settings

# Create a MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)

# Get the database
db = client[settings.MONGODB_DB_NAME]

def get_database() -> Database:
    """
    Get the MongoDB database.
    """
    return db

# Create indexes for collections
async def create_indexes():
    """
    Create indexes for MongoDB collections.
    """
    try:
        # Users collection - email index
        await db["users"].create_index("email", unique=True)
        
        # Interviews collection - user_id index
        await db["interviews"].create_index("user_id")
        
        # Roles collection - name index
        await db["roles"].create_index("name")
        
        # Questions collection - role_id index
        await db["questions"].create_index("role_id")
        
        # Answers collection - interview_id and question_id index
        await db["answers"].create_index([("interview_id", 1), ("question_id", 1)])
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error creating indexes: {e}")

# Initialize database
async def init_db():
    """
    Initialize the database.
    """
    try:
        # Create indexes
        await create_indexes()
        print(f"Database initialized successfully: {settings.MONGODB_URL}/{settings.MONGODB_DB_NAME}")
        
        # Print collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        # Count users
        user_count = await db["users"].count_documents({})
        print(f"User count: {user_count}")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise