import asyncio
import json
import sys
import argparse
from app.services.ai_service import call_ollama_api, call_huggingface_api
from app.core.config import settings

async def test_ollama():
    """Test the Ollama API integration"""
    print("\n=== Testing Ollama API Integration ===")
    print(f"Endpoint: {settings.LLM_ENDPOINT}")
    
    try:
        # Test a simple prompt
        prompt = "Generate 3 interview questions for a Software Engineer position."
        system_prompt = "You are an expert technical interviewer."
        
        print("\nSending prompt to Ollama...")
        
        response = await call_ollama_api(prompt, system_prompt)
        
        print("\nResponse from Ollama:")
        print("-" * 40)
        print(response[:500] + "..." if len(response) > 500 else response)
        print("-" * 40)
        
        return True
    except ConnectionError as e:
        print(f"\n❌ Connection Error: {str(e)}")
        print("\nTo use Ollama locally:")
        print("1. Download and install Ollama from https://ollama.ai/download")
        print("2. Start the Ollama application")
        print("3. Run: ollama pull llama3")
        print("4. Make sure the Ollama server is running on http://localhost:11434")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

async def test_huggingface():
    """Test the Hugging Face API integration"""
    print("\n=== Testing Hugging Face API Integration ===")
    print(f"Endpoint: {settings.HUGGINGFACE_ENDPOINT}")
    
    if not settings.HUGGINGFACE_API_TOKEN:
        print("\n❌ Error: No Hugging Face API token provided.")
        print("Please add your Hugging Face API token to the .env file:")
        print("HUGGINGFACE_API_TOKEN=your_token_here")
        return False
    
    try:
        # Test a simple prompt
        prompt = "Generate 3 interview questions for a Software Engineer position."
        system_prompt = "You are an expert technical interviewer."
        
        print("\nSending prompt to Hugging Face...")
        
        response = await call_huggingface_api(prompt, system_prompt)
        
        print("\nResponse from Hugging Face:")
        print("-" * 40)
        print(response[:500] + "..." if len(response) > 500 else response)
        print("-" * 40)
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

async def test_interview_questions():
    """Test generating structured interview questions"""
    print("\n=== Testing Structured Question Generation ===")
    
    # Determine which LLM provider to use
    provider = "ollama" if settings.LLM_MODEL.startswith("ollama/") else "huggingface"
    
    prompt = """
    Generate 3 interview questions for a Senior Software Engineer position.
    
    Format the response as a JSON array of question objects with the following structure:
    [
      {
        "text": "Question text here",
        "type": "technical" or "behavioral",
        "difficulty": integer from 1-5,
        "skill_tested": "Name of skill being tested",
        "reference_answer": "A reference answer to evaluate against"
      }
    ]
    
    Make sure the JSON is valid.
    """
    
    system_prompt = "You are an expert technical interviewer. Always provide responses in valid JSON format."
    
    try:
        print(f"\nUsing {provider} to generate structured interview questions...")
        
        if provider == "ollama":
            response = await call_ollama_api(prompt, system_prompt)
        else:
            response = await call_huggingface_api(prompt, system_prompt)
        
        print("\nRaw response:")
        print("-" * 40)
        print(response[:200] + "..." if len(response) > 200 else response)
        
        # Attempt to parse JSON
        try:
            parsed = json.loads(response)
            print("\nSuccessfully parsed JSON!")
            print(f"Generated {len(parsed)} questions.")
            
            # Print a sample question
            if parsed:
                print("\nSample question:")
                print(f"Question: {parsed[0].get('text', 'N/A')}")
                print(f"Type: {parsed[0].get('type', 'N/A')}")
                print(f"Difficulty: {parsed[0].get('difficulty', 'N/A')}")
            
            return True
        except json.JSONDecodeError:
            print("\n❌ Could not parse response as JSON.")
            
            # Try to extract JSON using regex
            import re
            json_match = re.search(r'\[\s*{.*}\s*\]', response, re.DOTALL)
            if json_match:
                try:
                    extracted_json = json_match.group(0)
                    parsed = json.loads(extracted_json)
                    print("\nSuccessfully extracted and parsed JSON!")
                    print(f"Generated {len(parsed)} questions.")
                    return True
                except:
                    print("Could not parse extracted JSON")
            
            return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

async def main():
    parser = argparse.ArgumentParser(description="Test LLM integration")
    parser.add_argument('--all', action='store_true', help='Test all LLM providers')
    parser.add_argument('--ollama', action='store_true', help='Test Ollama integration')
    parser.add_argument('--huggingface', action='store_true', help='Test Hugging Face integration')
    parser.add_argument('--interview', action='store_true', help='Test interview question generation')
    
    args = parser.parse_args()
    
    # If no arguments provided, test according to configured LLM_MODEL
    if not (args.all or args.ollama or args.huggingface or args.interview):
        if settings.LLM_MODEL.startswith("ollama/"):
            args.ollama = True
            args.interview = True
        elif settings.LLM_MODEL.startswith("huggingface/"):
            args.huggingface = True
            args.interview = True
        else:
            args.all = True
            
    # Run the appropriate tests
    results = {}
    
    if args.ollama or args.all:
        results["ollama"] = await test_ollama()
        
    if args.huggingface or args.all:
        results["huggingface"] = await test_huggingface()
        
    if args.interview:
        results["interview"] = await test_interview_questions()
    
    # Print summary
    print("\n=== Test Summary ===")
    for test, result in results.items():
        print(f"{test}: {'✅ Success' if result else '❌ Failed'}")
    
    # Return success if all tests passed, or if at least one passed
    if not results:
        return 1
    return 0 if all(results.values()) else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 