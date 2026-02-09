# Working AI Models (November 2024)

> **Note**: Qognix now fetches models **dynamically from the backend API**. This document is for reference only.

## Current Working Models

These models are verified working as of November 2024:

### Claude (Anthropic)

| Model ID | Name | Description | Pricing (per 1M tokens) |
|----------|------|-------------|------------------------|
| `claude-3-opus-20240229` | Claude 3 Opus | Most powerful | $15 / $75 |
| `claude-3-sonnet-20240229` | Claude 3 Sonnet | **Recommended** | $3 / $15 |
| `claude-3-haiku-20240307` | Claude 3 Haiku | Fastest, cheapest | $0.25 / $1.25 |

**Get API Key**: https://console.anthropic.com/

---

### OpenAI

| Model ID | Name | Description | Pricing (per 1M tokens) |
|----------|------|-------------|------------------------|
| `gpt-4o` | GPT-4o | **Recommended** | $2.5 / $10 |
| `gpt-4o-mini` | GPT-4o Mini | Faster, cheaper | $0.15 / $0.6 |
| `gpt-4-turbo` | GPT-4 Turbo | Previous gen | $10 / $30 |
| `gpt-4` | GPT-4 | Original | $30 / $60 |
| `gpt-3.5-turbo` | GPT-3.5 Turbo | Cheapest | $0.5 / $1.5 |

**Get API Key**: https://platform.openai.com/api-keys

---

### Gemini (Google)

| Model ID | Name | Description | Pricing (per 1M tokens) |
|----------|------|-------------|------------------------|
| `gemini-2.5-flash` | Gemini 2.5 Flash | **Recommended** | Free tier |
| `gemini-1.5-pro` | Gemini 1.5 Pro | More powerful | $1.25 / $5 |
| `gemini-1.5-flash` | Gemini 1.5 Flash | Previous version | Free tier |
| `gemini-pro` | Gemini Pro | Older version | $0.5 / $1.5 |

**Get API Key**: https://makersuite.google.com/app/apikey

---

## Deprecated Models (Do NOT Use)

### ❌ Claude

- `claude-3-5-sonnet-20241022` - Not available yet for all API keys
- `claude-3-5-sonnet-20240620` - Deprecated, returns 404
- `claude-3-5-haiku-20241022` - Not available yet
- `gemini-pro` (old ID) - Use `gemini-2.5-flash` instead

---

## How Models Are Updated

Qognix now uses a **dynamic model system**:

1. Models are fetched from `/api/models/all` endpoint
2. Backend API maintains the list of available models
3. Frontend displays models in real-time
4. No app update needed when models change

See `DYNAMIC_MODELS.md` for technical details.

---

## Recommendations

### For SQL Generation

1. **Claude 3 Sonnet** - Best balance of quality and cost
2. **GPT-4o** - Fast and reliable
3. **Gemini 2.5 Flash** - Free tier, good for testing

### For Complex Queries

1. **Claude 3 Opus** - Most powerful, best for complex schemas
2. **GPT-4** - Original, very reliable
3. **Gemini 1.5 Pro** - Good alternative

### For High Volume

1. **Claude 3 Haiku** - Cheapest Claude model
2. **GPT-4o Mini** - Fast and cheap
3. **Gemini 2.5 Flash** - Free tier

---

## Testing Models

To test if a model works with your API key:

```bash
# Claude
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]}'

# OpenAI
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 10}'

# Gemini
curl "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "hi"}]}]}'
```

---

## Troubleshooting

### 404 Model Not Found

- Model ID is incorrect or deprecated
- Check available models in API Keys page
- Try a different model from the dropdown

### 401 Authentication Error

- API key is invalid or expired
- Get a new key from provider's console
- Make sure key is copied correctly (no spaces)

### 429 Rate Limit

- You've exceeded your API quota
- Wait a few minutes and try again
- Upgrade your plan with the provider

---

## Future Updates

This document will be updated as:
- New models are released
- Models are deprecated
- Pricing changes
- New providers are added

For the most current list, always check the **API Keys** page in Qognix.
