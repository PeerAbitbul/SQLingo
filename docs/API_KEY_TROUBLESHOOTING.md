# API Key Troubleshooting Guide

**Date:** November 29, 2024

---

## Common API Key Errors

### 🔴 Error: "Invalid Claude API key"

**Full Error:**
```
Error: Claude request failed: Error code: 401 - {'type': 'error', 'error': {'type': 'authentication_error', 'message': 'invalid x-api-key'}}
```

**Solution:**
1. Open **Settings** → **API Keys** in Qognix
2. Check your Claude API key
3. Get a valid API key from: https://console.anthropic.com/settings/keys
4. Make sure you copied the entire key (starts with `sk-ant-`)
5. Paste the new key and save

---

### 🔴 Error: "Invalid OpenAI API key"

**Full Error:**
```
Error: OpenAI request failed: Incorrect API key provided
```

**Solution:**
1. Open **Settings** → **API Keys** in Qognix
2. Check your OpenAI API key
3. Get a valid API key from: https://platform.openai.com/api-keys
4. Make sure you copied the entire key (starts with `sk-`)
5. Check your billing at: https://platform.openai.com/account/billing
6. Paste the new key and save

---

### 🔴 Error: "Invalid Gemini API key"

**Full Error:**
```
Error: Gemini request failed: 400 API_KEY_INVALID
```

**Solution:**
1. Open **Settings** → **API Keys** in Qognix
2. Check your Gemini API key
3. Get a valid API key from: https://aistudio.google.com/app/apikey
4. Make sure the API key has the correct permissions
5. Paste the new key and save

---

## How to Access API Keys in Qognix

### Method 1: Via Sidebar (Recommended)
1. Click the **☰ Menu** button (top-left)
2. Scroll to the bottom of the sidebar
3. Click **🔑 API Keys**
4. Enter or update your API keys

### Method 2: Via Settings
1. Click **☰ Menu** → **⚙️ Settings**
2. Navigate to the API Keys section
3. Enter or update your API keys

---

## Getting API Keys

### Claude (Anthropic)
1. Go to: https://console.anthropic.com/settings/keys
2. Sign in or create an account
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-`)
5. Paste into Qognix

**Pricing:**
- Claude 3.5 Sonnet: $3/M input, $15/M output tokens
- Claude 3 Haiku: $0.25/M input, $1.25/M output tokens

---

### OpenAI
1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste into Qognix

**Important:** 
- Check your billing at: https://platform.openai.com/account/billing
- Add payment method if needed

**Pricing:**
- GPT-4o: $2.50/M input, $10/M output tokens
- GPT-4o-mini: $0.15/M input, $0.60/M output tokens

---

### Gemini (Google)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Paste into Qognix

**Pricing:**
- Gemini 2.5 Flash: Free tier available
- Gemini 1.5 Pro: $1.25/M input, $5/M output tokens

---

## Validation

After entering your API key, Qognix will show:
- ✅ **Green checkmark** - Key is valid
- ❌ **Red X** - Key is invalid
- ⚠️ **Warning** - Key format looks wrong

---

## Testing Your API Key

1. Create a new chat
2. Select a database connection
3. Ask a simple question: "Show me all tables"
4. If you get an error, check the error message:
   - **401/403** → Invalid API key
   - **429** → Rate limit exceeded
   - **500** → Server error (try again)

---

## Common Mistakes

### ❌ Incomplete Key
```
Wrong: sk-ant-api03-abc...xyz (truncated)
Right: sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890... (full key)
```

### ❌ Extra Spaces
```
Wrong: " sk-ant-api03-... " (spaces before/after)
Right: "sk-ant-api03-..." (no spaces)
```

### ❌ Wrong Provider
```
Wrong: Using OpenAI key with Claude provider
Right: Match the key to the correct provider
```

---

## API Key Security

### ✅ Best Practices:
1. **Never share** your API keys
2. **Don't commit** keys to git/GitHub
3. **Rotate keys** regularly
4. **Use separate keys** for different apps
5. **Monitor usage** on provider dashboards

### 🔒 How Qognix Stores Keys:
- Keys are stored **locally** on your computer
- Encrypted with **Fernet** (AES-128)
- Never sent to Qognix servers (BYOK mode)
- Only sent to AI provider APIs

---

## Managed API Mode (Future)

If you don't want to manage API keys:

1. Sign up for Qognix Managed API
2. Subscribe to a plan
3. Switch to "Managed" mode in settings
4. No API keys needed!

**Benefits:**
- No API key management
- Consolidated billing
- Usage tracking
- Priority support

---

## Still Having Issues?

### Check Provider Status:
- **Claude:** https://status.anthropic.com/
- **OpenAI:** https://status.openai.com/
- **Gemini:** https://status.cloud.google.com/

### Error Messages:
Qognix now provides helpful error messages:
- Invalid API key → Link to get new key
- Rate limit → Try again later
- Quota exceeded → Check billing

### Contact Support:
If you're still stuck, the error message will guide you to:
1. Check your API key
2. Verify billing/quota
3. Try a different provider

---

## Quick Reference

| Provider | Key Format | Get Key URL | Pricing |
|----------|-----------|-------------|---------|
| Claude | `sk-ant-...` | https://console.anthropic.com/settings/keys | $3-15/M tokens |
| OpenAI | `sk-...` | https://platform.openai.com/api-keys | $0.15-10/M tokens |
| Gemini | Various | https://aistudio.google.com/app/apikey | Free tier available |

---

**Remember:** Always keep your API keys secure and never share them publicly!

