#!/usr/bin/env python3
"""
Test script to verify Hugging Face integration for both LLM and speech-to-text services.
This script tests connections to Hugging Face APIs and verifies they're working properly.
"""

import os
import sys
import json
import argparse
import requests
from typing import Dict, Any, Optional
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Default settings
DEFAULT_HF_LLM_ENDPOINT = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
DEFAULT_HF_STT_ENDPOINT = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
# Use a reliable sample audio URL
SAMPLE_AUDIO_URL = "https://cdn.openai.com/whisper/draft-20220913a/micro-machines.wav"

# Set up command-line arguments
parser = argparse.ArgumentParser(description="Test Hugging Face API integration")
parser.add_argument("--api-token", type=str, help="Hugging Face API token")
parser.add_argument("--llm-endpoint", type=str, help="Hugging Face LLM endpoint URL")
parser.add_argument("--stt-endpoint", type=str, help="Hugging Face speech-to-text endpoint URL")
parser.add_argument("--test-llm", action="store_true", help="Test LLM functionality")
parser.add_argument("--test-stt", action="store_true", help="Test speech-to-text functionality")
parser.add_argument("--audio-file", type=str, help="Path to audio file for testing")

def get_hf_token() -> str:
    """Get Hugging Face API token from arguments or environment"""
    token = args.api_token or os.environ.get("HUGGINGFACE_API_TOKEN")
    if not token:
        raise ValueError("Hugging Face API token not provided. Use --api-token or set HUGGINGFACE_API_TOKEN environment variable.")
    return token

def test_llm_api(api_token: str, endpoint: str) -> bool:
    """Test Hugging Face LLM API by generating text"""
    print(f"\n--- Testing LLM API at {endpoint} ---")
    
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    # Prepare a simple prompt
    prompt = "Generate 3 interview questions for a Software Engineer position"
    formatted_prompt = f"<s>[INST] You are a helpful assistant. {prompt} [/INST]"
    
    payload = {
        "inputs": formatted_prompt,
        "parameters": {
            "max_new_tokens": 256,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    # Make the request
    try:
        print("Sending request to Hugging Face LLM API...")
        start_time = time.time()
        response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        elapsed_time = time.time() - start_time
        
        # Check if the model is still loading
        if response.status_code == 503 and "loading" in response.text.lower():
            print(f"Model is still loading. Please try again in a few minutes.")
            return False
            
        # Check if the request was successful
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        
        # Extract and print the generated text
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                text = result[0]["generated_text"].replace(formatted_prompt, "").strip()
            else:
                text = str(result[0]).strip()
        elif isinstance(result, dict) and "generated_text" in result:
            text = result["generated_text"].replace(formatted_prompt, "").strip()
        else:
            text = str(result).strip()
        
        print(f"Generated text ({elapsed_time:.2f}s):")
        print(f"{text[:500]}...")
        if len(text) > 500:
            print(f"(output truncated, total length: {len(text)} characters)")
        
        print("✅ LLM API test successful!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to Hugging Face LLM API: {str(e)}")
        return False

def download_sample_audio() -> str:
    """Download a sample audio file for testing speech-to-text"""
    print(f"Downloading sample audio from {SAMPLE_AUDIO_URL}...")
    
    try:
        # Create a temp directory if it doesn't exist
        os.makedirs("tmp", exist_ok=True)
        
        # Download the file
        response = requests.get(SAMPLE_AUDIO_URL, stream=True)
        response.raise_for_status()
        
        # Save to disk
        file_path = os.path.join("tmp", "sample_audio.flac")
        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded sample audio to {file_path}")
        return file_path
        
    except Exception as e:
        print(f"Error downloading sample audio: {str(e)}")
        sys.exit(1)

def test_speech_to_text(api_token: str, endpoint: str, audio_path: Optional[str] = None) -> bool:
    """Test Hugging Face speech-to-text API"""
    print(f"\n--- Testing Speech-to-Text API at {endpoint} ---")
    
    # If no audio file is specified, download a sample
    if not audio_path:
        audio_path = download_sample_audio()
    else:
        print(f"Using provided audio file: {audio_path}")
    
    # Read the audio file
    try:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
    except Exception as e:
        print(f"❌ Error reading audio file: {str(e)}")
        return False
    
    # Prepare headers
    headers = {
        "Authorization": f"Bearer {api_token}"
    }
    
    # Make the request
    try:
        print("Sending request to Hugging Face Speech-to-Text API...")
        start_time = time.time()
        
        # Try binary data approach first
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                data=audio_bytes,
                timeout=60
            )
            response.raise_for_status()
        except:
            # Fallback to multipart form upload
            print("Retrying with multipart form upload...")
            files = {
                "file": (os.path.basename(audio_path), audio_bytes),
            }
            response = requests.post(
                endpoint,
                headers=headers,
                files=files,
                timeout=60
            )
            response.raise_for_status()
        
        elapsed_time = time.time() - start_time
        
        # Check if the model is still loading
        if response.status_code == 503 and "loading" in response.text.lower():
            print(f"Model is still loading. Please try again in a few minutes.")
            return False
            
        # Parse the response
        result = response.json()
        
        # Extract and print the transcription
        if isinstance(result, dict) and "text" in result:
            text = result["text"]
        elif isinstance(result, list) and len(result) > 0 and "text" in result[0]:
            text = result[0]["text"]
        else:
            text = str(result)
        
        print(f"Transcription ({elapsed_time:.2f}s):")
        print(f"{text}")
        
        print("✅ Speech-to-Text API test successful!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to Hugging Face Speech-to-Text API: {str(e)}")
        return False

def test_json_generation(api_token: str, endpoint: str) -> bool:
    """Test the LLM's ability to generate structured JSON responses"""
    print("\n--- Testing LLM JSON generation ---")
    
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    # Prepare a prompt that requires a JSON response
    prompt = """
    Generate 3 interview questions for a Software Engineer position.
    Format the response as a JSON array of question objects with the following structure:
    [
      {
        "text": "Question text here",
        "type": "technical" or "behavioral",
        "difficulty": integer from 1-5,
        "skill_tested": "Name of skill being tested"
      }
    ]
    Ensure the JSON is valid and properly formatted.
    """
    
    formatted_prompt = f"<s>[INST] You are an expert technical interviewer. {prompt} [/INST]"
    
    payload = {
        "inputs": formatted_prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    # Make the request
    try:
        print("Testing JSON generation capability...")
        response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        
        # Extract the generated text
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                text = result[0]["generated_text"].replace(formatted_prompt, "").strip()
            else:
                text = str(result[0]).strip()
        elif isinstance(result, dict) and "generated_text" in result:
            text = result["generated_text"].replace(formatted_prompt, "").strip()
        else:
            text = str(result).strip()
        
        # Try to extract and parse JSON from the response
        import re
        json_pattern = r'(\[[\s\S]*\])'
        json_match = re.search(json_pattern, text)
        
        if json_match:
            json_str = json_match.group(1)
            questions = json.loads(json_str)
            
            print(f"Successfully parsed JSON with {len(questions)} questions:")
            print(json.dumps(questions, indent=2))
            
            print("✅ JSON generation test successful!")
            return True
        else:
            print("❌ Failed to extract JSON from response")
            print(f"Raw response: {text[:500]}...")
            return False
            
    except json.JSONDecodeError:
        print("❌ Failed to parse JSON in the response")
        print(f"Raw response: {text[:500]}...")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to Hugging Face API: {str(e)}")
        return False

def print_setup_instructions():
    """Print instructions for setting up Hugging Face APIs"""
    print("\n=== Hugging Face API Setup Instructions ===")
    print("""
1. Create a Hugging Face account at https://huggingface.co/join
2. Generate an API token at https://huggingface.co/settings/tokens
3. Add the token to your .env file:
   HUGGINGFACE_API_TOKEN=your_token_here
   
4. Configure your preferred models in config.py or .env:
   HUGGINGFACE_ENDPOINT=https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2
   SPEECH_TO_TEXT_ENDPOINT=https://api-inference.huggingface.co/models/openai/whisper-large-v3
   
5. Free alternative models to consider:
   - LLM: mistralai/Mistral-7B-Instruct-v0.2
   - LLM: meta-llama/Llama-2-7b-chat-hf
   - LLM: google/gemma-7b-it
   - LLM: openchat/openchat-3.5-1210
   - STT: openai/whisper-large-v3
   - STT: facebook/wav2vec2-large-960h-lv60-self
    """)

if __name__ == "__main__":
    args = parser.parse_args()
    
    # Default to testing both if no specific tests are requested
    if not (args.test_llm or args.test_stt):
        args.test_llm = True
        args.test_stt = True
    
    try:
        api_token = get_hf_token()
        
        results = []
        
        # Test LLM API
        if args.test_llm:
            llm_endpoint = args.llm_endpoint or os.environ.get("HUGGINGFACE_ENDPOINT", DEFAULT_HF_LLM_ENDPOINT)
            llm_result = test_llm_api(api_token, llm_endpoint)
            results.append(("LLM API", llm_result))
            
            # If LLM test passed, also test JSON generation
            if llm_result:
                json_result = test_json_generation(api_token, llm_endpoint)
                results.append(("JSON Generation", json_result))
        
        # Test Speech-to-Text API
        if args.test_stt:
            stt_endpoint = args.stt_endpoint or os.environ.get("SPEECH_TO_TEXT_ENDPOINT", DEFAULT_HF_STT_ENDPOINT)
            stt_result = test_speech_to_text(api_token, stt_endpoint, args.audio_file)
            results.append(("Speech-to-Text API", stt_result))
        
        # Print summary of results
        print("\n=== Test Results Summary ===")
        all_passed = True
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            all_passed = all_passed and result
            print(f"{name}: {status}")
        
        # Print setup instructions if any tests failed
        if not all_passed:
            print_setup_instructions()
            sys.exit(1)
        
        print("\n✅ All tests passed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print_setup_instructions()
        sys.exit(1) 