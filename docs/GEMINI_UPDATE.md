# Gemini API Update

## Issue
The old `gemini-pro` model is no longer supported in the Gemini API v1beta.

**Error:**
```
404 models/gemini-pro is not found for API version v1beta, 
or is not supported for generateContent.
```

## Solution
Updated to use the newer `gemini-1.5-flash` model.

## Changes Made

### File: `desktop/backend/ai/client.py`

**Before:**
```python
self.client = genai.GenerativeModel('gemini-pro')
```

**After:**
```python
self.client = genai.GenerativeModel('gemini-1.5-flash')
```

## Available Gemini Models (as of Nov 2024)

- `gemini-1.5-flash` - Fast and efficient (recommended for most use cases)
- `gemini-1.5-pro` - More capable, slower
- `gemini-1.0-pro` - Legacy model (may be deprecated soon)

## How to Change Model

Edit `desktop/backend/ai/client.py` line 26:

```python
# For faster responses (recommended)
self.client = genai.GenerativeModel('gemini-1.5-flash')

# For better quality (slower)
self.client = genai.GenerativeModel('gemini-1.5-pro')
```

After changing, restart the backend:
```bash
pkill -f "python.*main.py"
cd desktop/backend && source venv/bin/activate && python main.py
```

---

**Note:** No frontend changes required. The model change is transparent to the user.

