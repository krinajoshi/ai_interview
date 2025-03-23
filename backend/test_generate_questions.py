import requests
import json
import os
import sys

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
INTERVIEW_ID = ""  # Replace with an actual interview ID 
JWT_TOKEN = ""     # Replace with a valid JWT token

def test_generate_questions():
    """Test the generate-questions endpoint"""
    if not INTERVIEW_ID:
        print("❌ Please provide an INTERVIEW_ID in the script")
        return False
        
    if not JWT_TOKEN:
        print("❌ Please provide a JWT_TOKEN in the script")
        return False
    
    # Headers for authentication
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test both paths to see which one works
    endpoints = [
        f"{API_BASE_URL}/interviews/{INTERVIEW_ID}/generate-questions",  # Correct path based on our implementation
        f"{API_BASE_URL}/interview/generate-questions"                   # Path from error message
    ]
    
    success = False
    for endpoint in endpoints:
        print(f"\nTesting endpoint: {endpoint}")
        try:
            response = requests.post(endpoint, headers=headers)
            
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                print("✓ Request successful!")
                print("\nResponse:")
                print("-" * 40)
                try:
                    questions = response.json()
                    print(f"Generated {len(questions)} questions")
                    for i, q in enumerate(questions[:3], 1):  # Show first 3 questions
                        print(f"\nQuestion {i}:")
                        print(f"Text: {q.get('text')}")
                        print(f"Type: {q.get('type')}")
                        print(f"Difficulty: {q.get('difficulty')}")
                except:
                    print(response.text[:500])  # Show raw response if JSON parsing fails
                
                success = True
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    return success

def main():
    print("Test script for generate-questions endpoint")
    print("===========================================")
    
    # Check if server is running
    try:
        health_check = requests.get(f"{API_BASE_URL.split('/api')[0]}/health")
        if health_check.status_code != 200:
            print(f"❌ API server may not be running. Health check returned: {health_check.status_code}")
            return 1
    except Exception as e:
        print(f"❌ Cannot connect to API server: {str(e)}")
        print("Please ensure the backend server is running.")
        return 1
        
    success = test_generate_questions()
    
    if not success:
        print("\nPlease fix the following:")
        print("1. Ensure you have a valid INTERVIEW_ID in the script")
        print("2. Ensure you have a valid JWT_TOKEN in the script")
        print("3. Make sure the backend server is running")
        print("4. Check the API routes are properly configured")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 