#!/usr/bin/env python3
"""
Script to download and test the multilingual model for interview questions.
Run this script once to download the model before starting the application.
"""

import os
import sys
from transformers import AutoModelForCausalLM, AutoTokenizer

def download_model():
    """Download the model and tokenizer"""
    print("Downloading multilingual model (this may take a few minutes)...")
    
    try:
        # BLOOMZ-1B7 is a good balance of size and capability
        model_name = "bigscience/bloomz-1b7"
        
        # Download tokenizer
        print("Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Download model with 8-bit quantization
        print("Downloading model with 8-bit quantization...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            load_in_8bit=True,  # Reduces memory usage
            device_map="auto"   # Uses GPU if available
        )
        
        # Test the model
        print("Testing model...")
        prompt = "Generate an interview question for a software engineer:"
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(inputs["input_ids"], max_length=100, do_sample=True)
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        print("\nModel test successful!")
        print(f"Prompt: {prompt}")
        print(f"Response: {response}")
        
        print("\nModel downloaded and ready to use!")
        return True
        
    except Exception as e:
        print(f"Error downloading model: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting model download...")
    success = download_model()
    if success:
        print("Model installation complete!")
        sys.exit(0)
    else:
        print("Model installation failed!")
        sys.exit(1)