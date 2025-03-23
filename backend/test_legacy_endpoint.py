import requests
import json
import os
import sys

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
JWT_TOKEN = ""  # Replace with a valid JWT token

def test_legacy_endpoint():
    """Test the legacy interview/generate-questions endpoint"""
    if not JWT_TOKEN:
        print("❌ Please provide a JWT_TOKEN in the script")
        return False
    
    # Headers for authentication
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test payload matching the frontend format
    payload = {
        "jobTitle": "Software Engineer",
        "resume": "Sample resume content for testing",
        "jobDescription": "Sample job description for testing",
        "language": "en"
    }
    
    endpoint = f"{API_BASE_URL}/interview/generate-questions"
    print(f"\nTesting endpoint: {endpoint}")
    try:
        response = requests.post(
            endpoint, 
            headers=headers,
            json=payload
        )
        
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("✓ Request successful!")
            print("\nResponse:")
            print("-" * 40)
            try:
                data = response.json()
                print(f"Status: {data.get('status')}")
                print(f"Resume file name: {data.get('resumeFileName')}")
                questions = data.get('questions', [])
                print(f"Generated {len(questions)} questions")
                for i, q in enumerate(questions, 1):
                    print(f"\nQuestion {i}:")
                    print(f"Text: {q.get('text')}")
                    print(f"Type: {q.get('type')}")
                    print(f"Difficulty: {q.get('difficulty')}")
                
                return True
            except:
                print(response.text[:500])  # Show raw response if JSON parsing fails
                return False
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("Test script for legacy generate-questions endpoint")
    print("=================================================")
    
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
        
    success = test_legacy_endpoint()
    
    if not success:
        print("\nPlease fix the following:")
        print("1. Ensure you have a valid JWT_TOKEN in the script")
        print("2. Make sure the backend server is running")
        print("3. Check the API routes are properly configured")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 