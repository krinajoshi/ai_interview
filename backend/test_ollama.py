import requests
import json
import sys
import os

# Set default URL and model
OLLAMA_URL = "http://localhost:11434"
MODEL = "llama3"

def test_ollama():
    """Test Ollama API connection and response"""
    print(f"Testing Ollama API connection to {OLLAMA_URL}...")
    
    try:
        # Check if Ollama is running
        response = requests.get(f"{OLLAMA_URL}")
        if response.status_code != 200:
            print(f"❌ Ollama service is not running at {OLLAMA_URL}. Status code: {response.status_code}")
            return False
        
        print(f"✓ Connected to Ollama service")
        
        # Check available models
        models_response = requests.get(f"{OLLAMA_URL}/api/tags")
        if models_response.status_code != 200:
            print(f"❌ Failed to get models list. Status code: {models_response.status_code}")
            return False
        
        models = models_response.json().get("models", [])
        model_names = [model.get("name") for model in models]
        
        print(f"Available models: {', '.join(model_names) if model_names else 'No models found'}")
        
        if not model_names:
            print("❌ No models available. Please run 'ollama pull llama3' to download a model.")
            return False
        
        # Use the first model if the requested one isn't available
        test_model = MODEL if MODEL in model_names else model_names[0]
        print(f"Testing with model: {test_model}")
        
        # Test generating a response
        chat_payload = {
            "model": test_model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"}
            ]
        }
        
        chat_response = requests.post(f"{OLLAMA_URL}/api/chat", json=chat_payload)
        if chat_response.status_code != 200:
            print(f"❌ Failed to generate response. Status code: {chat_response.status_code}")
            print(f"Error: {chat_response.text}")
            return False
        
        result = chat_response.json()
        response_text = result.get("message", {}).get("content", "")
        
        print("\nResponse from model:")
        print("-" * 40)
        print(response_text[:200] + "..." if len(response_text) > 200 else response_text)
        print("-" * 40)
        
        print("✓ Successfully generated response from Ollama!")
        return True
    
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to Ollama at {OLLAMA_URL}")
        print("Please make sure Ollama is installed and running.")
        print("Installation guide: https://ollama.ai/download")
        return False
    except Exception as e:
        print(f"❌ Error testing Ollama: {str(e)}")
        return False

if __name__ == "__main__":
    # Get custom URL and model from command line arguments
    if len(sys.argv) > 1:
        OLLAMA_URL = sys.argv[1]
    if len(sys.argv) > 2:
        MODEL = sys.argv[2]
    
    # Also check environment variables
    OLLAMA_URL = os.environ.get("LLM_ENDPOINT", OLLAMA_URL)
    MODEL = os.environ.get("LLM_MODEL", MODEL).replace("ollama/", "")
    
    success = test_ollama()
    if not success:
        print("\nPlease follow these steps to set up Ollama:")
        print("1. Install Ollama from https://ollama.ai/download")
        print("2. Start Ollama")
        print("3. Download a model: ollama pull llama3")
        print("4. Make sure Ollama is running on http://localhost:11434")
    
    sys.exit(0 if success else 1) 