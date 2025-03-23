from jose import jwt
from datetime import datetime, timedelta
import json

# Mock secret key and algorithm
SECRET_KEY = "your-secret-key-for-testing"
ALGORITHM = "HS256"

def create_access_token(subject, expires_delta=None):
    """
    Create a JWT token with the given subject and expiration.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token):
    """
    Verify access token and return payload.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def test_token():
    # Create a token for a test user
    user_id = "test-user-123"
    token = create_access_token(user_id)
    print(f"Created token: {token}")
    
    # Verify the token
    try:
        payload = verify_access_token(token)
        print(f"Token verified: {json.dumps(payload, default=str)}")
        sub = payload.get("sub")
        print(f"Subject from token: {sub}")
        if sub == user_id:
            print("Successful token verification!")
        else:
            print(f"Token subject mismatch: {sub} != {user_id}")
    except Exception as e:
        print(f"Token verification failed: {str(e)}")

if __name__ == "__main__":
    test_token() 