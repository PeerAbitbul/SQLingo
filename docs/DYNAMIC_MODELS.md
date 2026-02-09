# Dynamic AI Models System

## Overview

Qognix now fetches available AI models **dynamically from the backend API** instead of using hardcoded model lists. This ensures that:

1. ✅ **Future-proof**: New models are automatically available without app updates
2. ✅ **Always current**: Models are updated from a central source
3. ✅ **No client lockout**: Users never get blocked by deprecated models
4. ✅ **Easy maintenance**: Update models in one place (backend API)

---

## Architecture

### Backend API (`desktop/backend/api/models_routes.py`)

New endpoints for fetching available models:

```
GET /api/models/claude    - Get Claude models
GET /api/models/openai    - Get OpenAI models
GET /api/models/gemini    - Get Gemini models
GET /api/models/all       - Get all models (combined)
```

#### Response Format

```json
{
  "models": [
    {
      "id": "claude-3-sonnet-20240229",
      "name": "Claude 3 Sonnet",
      "description": "Balanced performance (Recommended)",
      "provider": "claude",
      "pricing": {
        "input": 3.0,
        "output": 15.0
      }
    }
  ],
  "success": true
}
```

---

### Frontend (`desktop/frontend/src/components/APIKeyManager.tsx`)

The API Key Manager now:

1. **Fetches models on open** via `useEffect`
2. **Displays loading state** while fetching
3. **Falls back to defaults** if API fails
4. **Shows dynamic dropdowns** with real-time model info
5. **Displays pricing** from API response

```typescript
useEffect(() => {
  const fetchModels = async () => {
    const response = await apiClient.getAllModels();
    setAvailableModels({
      claude: response.claude,
      openai: response.openai,
      gemini: response.gemini,
    });
  };
  
  if (isOpen) {
    fetchModels();
  }
}, [isOpen]);
```

---

## How to Update Models

### Option 1: Update Backend API (Current)

Edit `desktop/backend/api/models_routes.py`:

```python
@router.get("/models/claude")
async def get_claude_models():
    models = [
        ModelInfo(
            id="claude-3-opus-20240229",
            name="Claude 3 Opus",
            description="Most powerful model",
            provider="claude",
            pricing={"input": 15.0, "output": 75.0}
        ),
        # Add new models here
    ]
    return ModelsResponse(models=models, success=True)
```

### Option 2: Fetch from External API (Future)

The backend can be extended to fetch models from:
- Anthropic's API
- OpenAI's API
- A centralized Qognix server
- A JSON file hosted online

Example:

```python
async def get_claude_models():
    # Fetch from Anthropic API
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.anthropic.com/v1/models")
        models = parse_anthropic_models(response.json())
    return ModelsResponse(models=models, success=True)
```

---

## Benefits

### 🚀 For Users

- **No more 404 errors** from deprecated models
- **Always see latest models** without app updates
- **Clear pricing info** for each model
- **Recommended models** marked with ⭐

### 🛠️ For Developers

- **Single source of truth** for models
- **Easy to update** (just edit backend)
- **Can fetch from external APIs** in future
- **Graceful fallbacks** if API fails

### 🏢 For Business

- **Future managed API** can control available models
- **Can offer different models** per subscription tier
- **Can deprecate models** without breaking clients
- **Can A/B test** new models easily

---

## Migration from Static Models

### Before (Hardcoded)

```typescript
// ❌ Old way - hardcoded in frontend
const VALID_CLAUDE_MODELS = [
  'claude-3-5-sonnet-20241022',  // Might not exist!
  'claude-3-opus-20240229',
];
```

### After (Dynamic)

```typescript
// ✅ New way - fetched from API
const response = await apiClient.getAllModels();
const claudeModels = response.claude; // Always up to date!
```

---

## Error Handling

### API Unavailable

If the backend API is down, the frontend falls back to safe defaults:

```typescript
catch (error) {
  console.error('Failed to fetch models:', error);
  setAvailableModels({
    claude: [
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', ... }
    ],
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o', ... }
    ],
    gemini: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', ... }
    ],
  });
}
```

### Invalid Model Selected

The backend validates models before making API calls. If a model is invalid:

1. Backend returns a clear error message
2. Frontend displays the error to user
3. User can select a different model from the dropdown

---

## Future Enhancements

### 1. Cache Models Locally

```typescript
// Cache models for 1 hour
const cachedModels = localStorage.getItem('cached-models');
if (cachedModels && !isExpired(cachedModels)) {
  setAvailableModels(JSON.parse(cachedModels));
} else {
  fetchModels();
}
```

### 2. Fetch from Managed API

```typescript
// When user is logged in to managed API
const response = await fetch('https://api.qognix.com/v1/models', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Returns models available for user's subscription tier
```

### 3. Model Recommendations

```typescript
// Backend can recommend models based on:
- Database type (SQL Server vs PostgreSQL)
- Query complexity
- User's budget
- Historical performance
```

### 4. Usage Statistics

```typescript
// Track which models are most popular
// Show "Most used" badge
// Suggest cheaper alternatives
```

---

## Testing

### Test Backend API

```bash
# Start backend
cd desktop/backend
python main.py

# Test endpoints
curl http://localhost:8000/api/models/claude
curl http://localhost:8000/api/models/openai
curl http://localhost:8000/api/models/gemini
curl http://localhost:8000/api/models/all
```

### Test Frontend

1. Open Qognix
2. Click "API Keys" in sidebar
3. Verify models load in dropdowns
4. Select a model and save
5. Send a query to test it works

---

## Summary

✅ **No more hardcoded models**  
✅ **Fetches from backend API**  
✅ **Easy to update**  
✅ **Future-proof**  
✅ **Graceful fallbacks**  

The system is now ready for:
- New model releases
- Managed API integration
- Subscription-based model access
- Dynamic pricing updates

