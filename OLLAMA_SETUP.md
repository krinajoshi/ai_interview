# Setting Up Ollama for Local LLM Support

This guide will walk you through the process of setting up Ollama to use local Large Language Models (LLMs) with the AI Interview Platform. Using local models provides benefits such as:

- **No API costs**: Run models locally without paying for API usage
- **Privacy**: Keep your data private without sending it to third-party services
- **Offline usage**: Use the application without an internet connection
- **Customization**: Fine-tune models for your specific use case

## Installation

### macOS

1. Download Ollama from the [official website](https://ollama.ai/download/mac).
2. Open the downloaded file and drag Ollama to your Applications folder.
3. Launch Ollama from your Applications folder.
4. Ollama will run in the background with an icon in your menu bar.

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

1. Download Ollama from the [official website](https://ollama.ai/download/windows).
2. Run the installer and follow the instructions.
3. After installation, Ollama will run in the background with an icon in the system tray.

## Starting Ollama

Once installed, Ollama runs as a server on port 11434. You can verify it's running by visiting [http://localhost:11434](http://localhost:11434) in your browser.

If you need to start it manually:

- **macOS/Linux**: Run `ollama serve` in your terminal
- **Windows**: Launch Ollama from the Start menu

## Pulling Models

Ollama needs to download models before you can use them. Here are the recommended models for the AI Interview Platform:

```bash
# Pull Llama 3 (recommended)
ollama pull llama3

# Alternative models
ollama pull mistral
ollama pull orca-mini
```

The first pull will take some time as it downloads the model files.

## Configuring the AI Interview Platform

To use Ollama with the AI Interview Platform:

1. Open your project's `.env` file in the backend directory
2. Update or add the following settings:

```
# Comment out or remove your OpenAI API key if you don't want to use it as a fallback
# OPENAI_API_KEY=your_openai_key

# Set the LLM model and endpoint
LLM_MODEL=ollama/llama3
LLM_ENDPOINT=http://localhost:11434
```

3. Restart your backend server for the changes to take effect:

```bash
cd backend
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Model Not Responding

If the model doesn't respond:

1. Make sure Ollama is running (`ollama serve`)
2. Verify the model is downloaded (`ollama list`)
3. Check if you can directly query the model: 
   ```bash
   curl -X POST http://localhost:11434/api/generate -d '{"model": "llama3", "prompt": "Hello"}'
   ```

### Slow Response Times

Local models can be slower than cloud APIs depending on your hardware. Try:

1. Using a smaller model like `orca-mini` instead of `llama3`
2. Setting a shorter context window if your hardware has limited RAM
3. Closing other resource-intensive applications

### JSON Parsing Errors

If you encounter JSON parsing errors:

1. Check the format of your prompts to ensure they instruct the model to return valid JSON
2. Try using a model with better JSON capabilities (llama3 is recommended)
3. Implement fallback mechanisms in your application's code

## Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama/tree/main/docs)
- [Available Models](https://ollama.ai/library)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)