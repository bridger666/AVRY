# OpenRouter Setup Guide

## Overview
Aivory now uses OpenRouter API instead of Sumopod for LLM inference. OpenRouter provides access to multiple AI models including free options.

## What Changed
- **OLD**: Sumopod API with custom model names
- **NEW**: OpenRouter API with standard model names

## Models Available

### 1. DeepSeek Chat (Primary - FREE)
- **Model ID**: `deepseek/deepseek-chat`
- **Use Cases**: Console chat, workflow generation, short/medium outputs
- **Max Tokens**: 4000
- **Cost**: FREE on OpenRouter
- **Speed**: Fast

### 2. Google Gemini 2.0 Flash (Secondary - FREE)
- **Model ID**: `google/gemini-2.0-flash-exp:free`
- **Use Cases**: Long outputs, deep analysis, reasoning-heavy tasks
- **Max Tokens**: 8000
- **Cost**: FREE on OpenRouter
- **Speed**: Fast

### 3. Qwen 2.5 7B (VPS - via PicoClaw)
- **Model ID**: `qwen/qwen-2.5-7b-instruct`
- **Use Cases**: VPS bridge integration
- **Max Tokens**: 3000
- **Cost**: VPS hosted
- **Speed**: Fast

## Setup Instructions

### Step 1: Get OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Go to Keys section: https://openrouter.ai/keys
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### Step 2: Configure Environment

Edit `.env.local` file:

```bash
# OpenRouter API (REQUIRED)
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Step 3: Restart Backend

```bash
# Stop the backend if running
# Then start it again
cd ~/Documents/Aivory
python -m uvicorn app.main:app --reload --port 8081
```

You should see:
```
✓ Configuration loaded successfully
  - App: Aivory AI Readiness Platform v1.0.0
  - OpenRouter API: Configured
```

### Step 4: Test Console

1. Open browser: `http://localhost:8080/console.html?tier=operator`
2. Type a message: "Hello, test the connection"
3. Click Send
4. You should get a response from DeepSeek Chat

## Files Modified

### New Files
- `app/llm/openrouter_client.py` - OpenRouter API client

### Updated Files
- `app/config.py` - Added OpenRouter configuration
- `app/config/model_config.py` - Updated model names to OpenRouter format
- `app/services/console_service.py` - Switched from Sumopod to OpenRouter
- `.env.local` - Added OpenRouter API key

## Troubleshooting

### Error: "OpenRouter API key not configured"
- Make sure `OPENROUTER_API_KEY` is set in `.env.local`
- Restart the backend server

### Error: "OpenRouter API error: 401"
- Your API key is invalid
- Get a new key from https://openrouter.ai/keys

### Error: "OpenRouter API timeout"
- Check your internet connection
- Try again (OpenRouter might be experiencing issues)

### Console still shows "Thinking..." forever
- Check backend logs for errors
- Make sure backend is running on port 8081
- Check browser console for frontend errors

## Cost Information

Both primary models are **FREE** on OpenRouter:
- DeepSeek Chat: Free
- Gemini 2.0 Flash: Free

You can monitor usage at: https://openrouter.ai/activity

## API Documentation

OpenRouter API docs: https://openrouter.ai/docs

## Next Steps

Once OpenRouter is working:
1. Test console chat functionality
2. Test diagnostic flows
3. Consider adding more models if needed
4. Monitor usage and costs (if using paid models)
