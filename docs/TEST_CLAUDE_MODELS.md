# Test Claude Models - Find What Works

Run these commands to test which Claude models actually work with your API key:

---

## Test Command

```bash
# Replace YOUR_API_KEY with your actual Claude API key

# Test Claude 3.5 Sonnet (Latest)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## Try These Models

### Option 1: claude-3-5-sonnet-20241022
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

### Option 2: claude-3-5-sonnet-latest
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-5-sonnet-latest", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

### Option 3: claude-3-opus-20240229
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-opus-20240229", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

### Option 4: claude-3-sonnet-20240229
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

### Option 5: claude-3-haiku-20240307
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

---

## What to Look For

### ✅ Success (200 OK)
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Hello! How can I help you?"}],
  ...
}
```

### ❌ Model Not Found (404)
```json
{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "model: claude-xxx"
  }
}
```

### ❌ Invalid API Key (401)
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
```

---

## After Testing

Once you find a model that works, update Qognix:

1. Note which model returned 200 OK
2. Go to API Keys in Qognix
3. Select that model from the dropdown
4. Try your query again

---

## Common Working Models (as of late 2024)

Based on Anthropic documentation:
- `claude-3-opus-20240229` - Most reliable
- `claude-3-sonnet-20240229` - Good balance
- `claude-3-haiku-20240307` - Fastest

**Note:** The 20241022 version might not be available yet for all API keys!

---

## Quick Test Script

Save this as `test_claude.sh`:

```bash
#!/bin/bash

API_KEY="YOUR_API_KEY_HERE"

models=(
  "claude-3-5-sonnet-20241022"
  "claude-3-5-sonnet-latest"
  "claude-3-opus-20240229"
  "claude-3-sonnet-20240229"
  "claude-3-haiku-20240307"
)

for model in "${models[@]}"; do
  echo "Testing: $model"
  response=$(curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "{\"model\": \"$model\", \"max_tokens\": 10, \"messages\": [{\"role\": \"user\", \"content\": \"hi\"}]}")
  
  if echo "$response" | grep -q "\"type\":\"message\""; then
    echo "✅ $model WORKS!"
  else
    echo "❌ $model FAILED"
    echo "$response" | grep "message"
  fi
  echo "---"
done
```

Run: `chmod +x test_claude.sh && ./test_claude.sh`

