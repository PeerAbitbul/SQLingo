# Clear Storage - Fix Model Issues

If you're getting 404 errors for deprecated models, follow these steps:

---

## Quick Fix

### Option 1: Automatic Migration (Recommended)
Just refresh the page! The app will automatically migrate old models to new ones.

1. **Refresh the browser** (Ctrl+R / Cmd+R)
2. **Check API Keys settings**
3. **Verify the model is:** `claude-3-5-sonnet-20241022`

---

## Option 2: Manual Clear (If Auto-Migration Fails)

### In Browser Console

1. **Open Developer Tools** (F12 or Cmd+Option+I)
2. **Go to Console tab**
3. **Run this command:**

```javascript
// Clear all Qognix storage
localStorage.removeItem('api-key-storage');
localStorage.removeItem('settings-storage');
localStorage.removeItem('chat-storage');
localStorage.removeItem('connection-storage');

// Reload
location.reload();
```

---

## Option 3: Clear Specific Model Only

```javascript
// Get current storage
const storage = JSON.parse(localStorage.getItem('api-key-storage') || '{}');

// Fix Claude model
if (storage.state) {
  storage.state.claudeModel = 'claude-3-5-sonnet-20241022';
  storage.state.openaiModel = 'gpt-4o';
  storage.state.geminiModel = 'gemini-2.5-flash';
  
  // Save back
  localStorage.setItem('api-key-storage', JSON.stringify(storage));
  
  // Reload
  location.reload();
}
```

---

## What Gets Cleared?

- ✅ **API Keys** - You'll need to re-enter them
- ✅ **Model selections** - Will reset to defaults
- ✅ **Settings** - Will reset to defaults
- ✅ **Chats** - All chat history will be deleted
- ✅ **Connections** - All saved connections will be deleted

---

## After Clearing

1. **Re-enter API Keys** (Settings → API Keys)
2. **Re-create Connections** (Settings → Connections)
3. **Select AI Provider** (Settings → AI Settings)
4. **Start fresh!**

---

## Prevention

The app now includes automatic migration, so this shouldn't happen again!

**Migration Features:**
- Auto-detects deprecated models
- Replaces with latest versions
- Validates models before use
- Shows warning if model is invalid

---

## Deprecated Models

These models will be automatically replaced:

### Claude
- ❌ `claude-3-5-sonnet-20240620` → ✅ `claude-3-5-sonnet-20241022`
- ❌ `claude-2.1` → ✅ `claude-3-5-sonnet-20241022`
- ❌ `claude-2.0` → ✅ `claude-3-5-sonnet-20241022`

### OpenAI
- ❌ `gpt-4-1106-preview` → ✅ `gpt-4o`
- ❌ `gpt-4-0613` → ✅ `gpt-4o`

### Gemini
- ❌ `gemini-2.0-flash-exp` → ✅ `gemini-2.5-flash`
- ❌ `gemini-pro-vision` → ✅ `gemini-1.5-pro`

---

## Still Having Issues?

1. **Check the backend logs** for the actual error
2. **Verify your API key** is valid
3. **Try a different model** from the dropdown
4. **Check provider status pages:**
   - Claude: https://status.anthropic.com/
   - OpenAI: https://status.openai.com/
   - Gemini: https://status.cloud.google.com/

---

**The automatic migration should fix this for you!**

