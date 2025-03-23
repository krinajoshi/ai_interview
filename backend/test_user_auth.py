import asyncio
import json
import jwt
from datetime import datetime, timedelta
from app.db.mongodb import connect_to_mongo, get_database
from app.core.config import settings
from app.core.security import create_access_token, verify_access_token

async def test_user_auth():
    # Connect to MongoDB
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    db = get_database()
    
    # Find a user in the database
    print("Searching for users in the database...")
    user = await db.users.find_one()
    if not user:
        print("No users found in the database!")
        return
    
    print(f"Found user: {user.get('email', 'No email')}")
    print(f"User ID: {user.get('_id', 'No ID')}")
    
    # Create a token for this user
    user_id = str(user.get('_id'))
    token = create_access_token(user_id)
    print(f"Created token: {token}")
    
    # Verify the token
    try:
        payload = verify_access_token(token)
        print(f"Token verified: {payload}")
        sub = payload.get("sub")
        print(f"Subject from token: {sub}")
        
        # Try to retrieve the user with this ID
        print(f"Retrieving user with ID {sub}...")
        retrieved_user = await db.users.find_one({"_id": sub})
        if retrieved_user:
            print(f"Successfully retrieved user: {retrieved_user.get('email')}")
        else:
            print(f"Could not find user with ID {sub}")
    except Exception as e:
        print(f"Token verification failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_user_auth()) 