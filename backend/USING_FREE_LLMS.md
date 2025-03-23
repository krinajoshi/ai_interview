# Using Free LLM Alternatives

This guide explains how to use free alternatives to OpenAI's API for generating interview questions and analyzing responses in the AI Interview Platform.

## Available Options

The AI Interview Platform supports the following LLM providers:

1. **Ollama** (Local LLM) - Run models locally on your machine
2. **Hugging Face** (Free API) - Use Hugging Face's inference API
3. **OpenAI** (Paid API) - Use OpenAI's commercial API (default)

## Configuration

You can configure which LLM provider to use by updating your `.env` file:

```
# LLM Settings
# Options:
# - "ollama/llama3" for local Ollama with llama3 model
# - "huggingface/mistral-7b" for Hugging Face hosted models
# - "openai/gpt-4" for OpenAI models (requires API key)
LLM_MODEL=huggingface/mistral-7b
```

### Option 1: Ollama (Local LLM)

[Ollama](https://ollama.ai/) lets you run LLMs locally on your own machine. This is completely free and private, as all processing happens on your computer.

#### Setup Instructions:

1. **Install Ollama**:
   - Download from [ollama.ai/download](https://ollama.ai/download)
   - Install and start the application

2. **Pull a Model**:
   ```bash
   ollama pull llama3
   ```

3. **Configure Your `.env` File**:
   ```
   LLM_MODEL=ollama/llama3
   LLM_ENDPOINT=http://localhost:11434
   ```

4. **Advantages**:
   - Completely free
   - Private (data never leaves your computer)
   - No API key needed
   - Works offline

5. **Disadvantages**:
   - Requires more powerful hardware
   - Model quality may be lower than cloud alternatives
   - Initial download can be large

### Option 2: Hugging Face (Free API)

[Hugging Face](https://huggingface.co/) provides a free inference API for many open-source models.

#### Setup Instructions:

1. **Create a Hugging Face Account**:
   - Sign up at [huggingface.co](https://huggingface.co/join)

2. **Get an API Token**:
   - Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Create a new token (Read access is sufficient)

3. **Configure Your `.env` File**:
   ```
   LLM_MODEL=huggingface/mistral-7b
   HUGGINGFACE_API_TOKEN=your_token_here
   HUGGINGFACE_ENDPOINT=https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2
   ```

4. **Advantages**:
   - Free for moderate usage
   - No local hardware requirements
   - Access to many state-of-the-art models
   - Easy to switch between different models

5. **Disadvantages**:
   - Rate limits apply
   - API key required
   - Requires internet connection
   - Your data is sent to Hugging Face servers

## Testing Your Setup

We've included a test script to verify your LLM integration:

```bash
python test_llm_integration.py
```

To test a specific provider:

```bash
python test_llm_integration.py --ollama       # Test Ollama
python test_llm_integration.py --huggingface  # Test Hugging Face
python test_llm_integration.py --all          # Test all providers
```

## Recommended Models

### For Ollama:

- **llama3** - Good all-around performer, balanced speed/quality
- **mistral** - Fast with good quality for most use cases
- **llama2** - Older but reliable model
- **mixtral** - Larger, higher quality model (requires more resources)

### For Hugging Face:

- **mistralai/Mistral-7B-Instruct-v0.2** - Excellent quality/speed balance
- **meta-llama/Llama-2-7b-chat-hf** - Solid performance for chat-style prompts  
- **google/gemma-7b-it** - Google's instruct-tuned model
- **openchat/openchat-3.5-1210** - Open source model designed to compete with ChatGPT

## Fallback Mechanism

The AI Interview Platform includes a robust fallback mechanism:

1. It first tries your configured LLM provider
2. If that fails, it tries alternative providers if configured
3. As a last resort, it uses built-in fallback questions and responses

This ensures that your application continues to function even if one provider is unavailable.

## Troubleshooting

### Ollama Issues:

- Verify Ollama is running (`http://localhost:11434/api/tags` should return a list of models)
- Check if you've pulled the model you're trying to use
- Ensure your firewall isn't blocking connections to the Ollama service

### Hugging Face Issues:

- Verify your API token is correct
- Check the model endpoint URL
- Some models might be overloaded or have queue times
- Free tier has rate limits

## Performance Considerations

- Local models (Ollama) will be faster after initial loading but require more system resources
- Cloud-based models (Hugging Face, OpenAI) may have higher latency but don't tax your local system
- Consider using smaller models (7B parameter range) for faster responses
- Use quantized models (GGUF format) with Ollama for better performance on limited hardware 