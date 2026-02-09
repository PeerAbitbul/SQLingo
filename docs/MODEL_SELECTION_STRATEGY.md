# Model Selection Strategy

## Overview
The system uses **different approaches for different AI providers** based on what each provider's API supports.

## Claude: Manual Model Input

### Why Manual Input?
Anthropic doesn't provide a public API endpoint to list available models. Instead of maintaining a hardcoded dropdown list that requires frequent app updates, we let users manually enter the model ID.

### Implementation
**File**: [APIKeyManager.tsx:344-363](desktop/frontend/src/components/APIKeyManager.tsx#L344-L363)

Claude model selection uses a text input:

```typescript
<FormGroup>
  <Label>Claude Model</Label>
  <Input
    type="text"
    placeholder="claude-3-5-sonnet-latest"
    value={localModels.claude}
    onChange={(e) =>
      setLocalModels({ ...localModels, claude: e.target.value })
    }
    $hasValue={!!localModels.claude}
  />
  <HelpText>
    Enter the model ID manually. See available models at{' '}
    <Link href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank">
      docs.anthropic.com/models
    </Link>
  </HelpText>
</FormGroup>
```

### Benefits
- ✅ **Zero Maintenance**: No app updates needed when Anthropic releases new models
- ✅ **Immediate Access**: Users can use new models the moment they're released
- ✅ **Official Documentation**: Direct link to Anthropic's model list
- ✅ **Simpler Code**: No API polling or verification logic needed
- ✅ **Zero Cost**: No API calls required
- ✅ **Flexibility**: Users can enter any model ID, including beta/experimental models

### User Experience
1. User enters their Claude API key
2. User types the model ID (e.g., `claude-3-5-sonnet-latest`)
3. Clicks the documentation link if they need to see available models
4. Model ID is saved to local storage
5. All Claude requests use this model ID

### Default Model
The default model in the store is set to `claude-3-5-sonnet-latest`, which Anthropic keeps updated to point to their latest Sonnet model.

**File**: [apiKeyStore.ts:28](desktop/frontend/src/stores/apiKeyStore.ts#L28)
```typescript
claudeModel: 'claude-3-5-sonnet-latest',
```

## OpenAI: Dropdown with API-Fetched Models

### Why Dropdown?
OpenAI provides a `/v1/models` API endpoint that lists all available models. We can query this to populate a dropdown.

### Implementation
**File**: [openai_provider.py:115-172](desktop/backend/ai/openai_provider.py#L115-L172)

The provider fetches models directly from OpenAI's API:

```python
def get_available_models(self) -> List[str]:
    try:
        # Fetch all models from OpenAI API
        models_response = self.client.models.list()

        # Filter to only GPT chat models
        chat_models = []
        for model in models_response.data:
            model_id = model.id
            if any(prefix in model_id for prefix in ["gpt-4", "gpt-3.5-turbo"]):
                chat_models.append(model_id)

        # Sort by priority
        # ... sorting logic ...

        return unique_models if unique_models else self._fallback_models()
    except Exception as e:
        logger.warning(f"Failed to fetch OpenAI models from API: {e}")
        return self._fallback_models()
```

### Benefits
- ✅ **Always Current**: Shows all currently available GPT models
- ✅ **User-Friendly**: Dropdown selection is easy
- ✅ **Free**: OpenAI doesn't charge for model listing
- ✅ **Fallback**: Uses static list if API fails

## Gemini: Dropdown with API-Fetched Models

### Why Dropdown?
Google provides a models API endpoint that lists all Gemini models with their capabilities.

### Implementation
**File**: [gemini_provider.py:167-227](desktop/backend/ai/gemini_provider.py#L167-L227)

The provider fetches models from Google's API:

```python
def get_available_models(self) -> List[str]:
    try:
        # Fetch available models from Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}"

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        # Extract models that support generateContent
        available_models = []
        for model in data.get("models", []):
            model_name = model.get("name", "")
            supported_methods = model.get("supportedGenerationMethods", [])

            if "generateContent" in supported_methods:
                if "/" in model_name:
                    model_name = model_name.split("/")[-1]
                available_models.append(model_name)

        return sorted_models if sorted_models else self._fallback_models()
    except Exception as e:
        logger.warning(f"Failed to fetch Gemini models from API: {e}")
        return self._fallback_models()
```

### Benefits
- ✅ **Always Current**: Shows all currently available Gemini models
- ✅ **Filtered**: Only shows models that support text generation
- ✅ **User-Friendly**: Dropdown selection is easy
- ✅ **Free**: Google doesn't charge for model listing
- ✅ **Fallback**: Uses static list if API fails

## Summary Table

| Provider | Selection Method | Reason | Maintenance |
|----------|-----------------|--------|-------------|
| **Claude** | Manual text input | No public models API | Zero - users enter model ID |
| **OpenAI** | Dropdown (API-fetched) | Has `/v1/models` endpoint | Zero - auto-updated from API |
| **Gemini** | Dropdown (API-fetched) | Has models API endpoint | Zero - auto-updated from API |

## Cost Analysis

| Provider | Cost per App Launch | Cost per User per Month (30 launches) |
|----------|---------------------|----------------------------------------|
| **Claude** | $0 (no API calls) | $0 |
| **OpenAI** | $0 (free endpoint) | $0 |
| **Gemini** | $0 (free endpoint) | $0 |

**Total Cost**: $0 - completely free for all providers

## Server Mode Considerations

When implementing Server mode (Managed API):

### Claude
- Same approach: text input for model ID
- No changes needed to frontend
- Server uses its own API keys but model ID comes from user input

### OpenAI & Gemini
- Backend fetches models using server's API keys
- Frontend calls server endpoint instead of direct provider APIs
- Same dropdown UX for users

## Future Enhancements

Potential improvements (not currently needed):

1. **Model Validation**: Check if entered Claude model ID is valid
2. **Popular Models**: Show suggestions for common Claude models
3. **Model Info**: Display pricing/capabilities for selected models
4. **Favorites**: Let users save multiple models per provider
5. **Auto-Complete**: Suggest Claude model IDs as user types

## User Documentation

### For Claude Users
1. Go to API Keys settings
2. Enter your Claude API key
3. In the "Claude Model" field, type the model ID you want to use
4. Click the documentation link if you need to see available models
5. Common model IDs:
   - `claude-3-5-sonnet-latest` (recommended - always latest)
   - `claude-3-5-sonnet-20241022` (specific version)
   - `claude-3-haiku-20240307` (fastest, cheapest)
6. Save your settings

### For OpenAI/Gemini Users
1. Go to API Keys settings
2. Enter your API key
3. Select a model from the dropdown
4. The list is automatically updated from the provider's API
5. Save your settings
