# Using Free APIs for the AI Interview Platform

This guide explains how to use free APIs for both language model (LLM) and speech-to-text functionality in the AI Interview Platform, eliminating the need for paid services or resource-intensive local models.

## Overview

The AI Interview Platform has been redesigned to use free services for all AI functionality:

1. **Language Model (LLM)**: Hugging Face provides free API access to powerful language models that generate interview questions and evaluate responses.

2. **Speech-to-Text**: Hugging Face provides free API access to speech recognition models like Whisper, or you can use Assembly AI with limited free tier.

## Setting Up Hugging Face

### Step 1: Create a Hugging Face Account
1. Go to [https://huggingface.co/join](https://huggingface.co/join)
2. Sign up for a free account
3. Verify your email address

### Step 2: Generate an API Token
1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Give it a name (e.g., "AI Interview Platform")
4. Select "Read" access
5. Click "Generate token"
6. Copy the token to use in your application

### Step 3: Configure Your Application
Add your Hugging Face token to your environment file (`.env`) in the project root:

```
HUGGINGFACE_API_TOKEN=your_token_here
LLM_MODEL=huggingface/mistral
SPEECH_TO_TEXT_PROVIDER=huggingface
```

## Available Language Models

The application is configured to use Hugging Face's free language models, with a fallback system that tries multiple models if one fails:

### Primary Models:
1. **Mistral-7B-Instruct**: A powerful 7B parameter instruction-tuned model
   - Set `LLM_MODEL=huggingface/mistral`

### Alternative Models:
- **Llama-2-7b-chat**: Meta's instructional model
   - Set `LLM_MODEL=huggingface/llama2`
- **Gemma-7b**: Google's latest instruction-tuned model
   - Set `LLM_MODEL=huggingface/gemma`
- **OpenChat-3.5**: An open source model similar to ChatGPT
   - Set `LLM_MODEL=huggingface/openchat`
- **Phi-2**: Microsoft's compact but powerful model
   - Set `LLM_MODEL=huggingface/phi2`
- **Falcon-7B**: A model from Technology Innovation Institute
   - Set `LLM_MODEL=huggingface/falcon`

The system will automatically format prompts correctly for each model type.

## Available Speech-to-Text Models

For speech-to-text functionality, we use Hugging Face's Whisper Large V3 model by default:

1. **Whisper Large V3**: OpenAI's model, hosted on Hugging Face
   - No configuration needed, this is the default

2. **Assembly AI** (Fallback): If you prefer to use Assembly AI:
   - Sign up at [https://www.assemblyai.com/](https://www.assemblyai.com/)
   - Get your API key
   - Add to your `.env` file:
     ```
     SPEECH_TO_TEXT_PROVIDER=assembly_ai
     ASSEMBLY_AI_API_KEY=your_key_here
     ```

## Testing Your Setup

We've included a test script to verify your Hugging Face integration:

```bash
python test_huggingface_integration.py
```

You can test specific components:
```bash
# Test only the language model
python test_huggingface_integration.py --test-llm

# Test only speech-to-text
python test_huggingface_integration.py --test-stt

# Test with a specific audio file
python test_huggingface_integration.py --test-stt --audio-file path/to/your/audio.wav
```

## Advanced Configuration

### Custom Model Endpoints

You can specify custom Hugging Face model endpoints in your `.env` file:

```
HUGGINGFACE_ENDPOINT=https://api-inference.huggingface.co/models/your-preferred-model
SPEECH_TO_TEXT_ENDPOINT=https://api-inference.huggingface.co/models/your-preferred-stt-model
```

### Environment Variables

All configurable options:

| Variable | Description | Default |
|----------|-------------|---------|
| `HUGGINGFACE_API_TOKEN` | Your Hugging Face API token | None (Required) |
| `LLM_MODEL` | The LLM model identifier | `huggingface/mistral` |
| `HUGGINGFACE_ENDPOINT` | Custom endpoint for the LLM | Based on model name |
| `SPEECH_TO_TEXT_PROVIDER` | Provider for speech-to-text | `huggingface` |
| `SPEECH_TO_TEXT_ENDPOINT` | Custom endpoint for speech-to-text | Whisper Large V3 |
| `ASSEMBLY_AI_API_KEY` | API key for Assembly AI | None |

## Fallback Mechanism

The application implements a robust fallback mechanism:

1. First tries the specified Hugging Face model
2. If that fails, attempts several alternative Hugging Face models
3. For speech recognition, tries Hugging Face first, then falls back to Assembly AI if configured
4. If all APIs fail, the system uses predefined questions and evaluation metrics

## Usage Limits

Be aware of Hugging Face's usage limits for free API access:

- Rate limiting may apply
- Models are loaded on demand, which may cause initial delay
- Some models may have usage quotas

For production applications with high traffic, consider:
1. Using a paid tier of Hugging Face
2. Implementing caching mechanisms
3. Setting up your own model deployment (e.g., with Hugging Face Inference Endpoints)

## Troubleshooting

### Common Issues:

1. **Model Loading Delay**: First API call might return a 503 error with "Model is loading" message
   - Solution: Retry after a few minutes

2. **Rate Limiting**: Too many requests in a short period
   - Solution: Implement exponential backoff and retry logic

3. **Token Authentication**: Invalid token errors
   - Solution: Verify your token is correct and has read permissions

4. **JSON Parsing Errors**: Some models may not follow the exact JSON format requested
   - Solution: The application includes regex-based extraction as a fallback

5. **Audio Format Issues**: Some speech-to-text models expect specific audio formats
   - Solution: Convert audio to a compatible format (e.g., mp3, wav, or flac)

## Comparison with Paid Alternatives

| Feature | Free APIs (This Guide) | Paid APIs (OpenAI) |
|---------|------------------------|-------------------|
| Cost | Free | Pay per token/request |
| Quality | Good to Very Good | Excellent |
| Reliability | May have occasional downtime | Enterprise reliability |
| Rate Limits | Yes, more restrictive | Higher limits |
| Privacy | Data shared with Hugging Face | Data shared with OpenAI |
| Setup Complexity | Slightly more complex | Simpler |

## Conclusion

By following this guide, you can run the AI Interview Platform with completely free AI services, maintaining most of the functionality without any API costs. The implementation includes robust fallback mechanisms to ensure reliability, even when individual services experience issues. 