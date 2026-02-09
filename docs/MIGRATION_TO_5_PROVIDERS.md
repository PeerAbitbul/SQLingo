# Migration Guide: API Mode Selector → 5 AI Providers

**Date:** December 31, 2025

---

## What Changed?

On **December 23, 2025**, Qognix underwent a major architectural change to simplify AI provider selection.

### Before (Old Architecture)
- **Settings:** API Mode selector (BYOK vs Managed)
- **3 Providers:** Claude, OpenAI, Gemini
- **Mode Selection:** Manual choice between BYOK and Managed

### After (New Architecture)
- **No API Mode Selector:** Mode determined automatically
- **5 Providers:** Claude, OpenAI, Gemini, Bedrock, Qognix AI
- **Automatic Mode:** Provider selection determines mode

---

## Migration Steps

### If You Used BYOK Mode

**No action needed!** Your API keys are preserved.

1. Your existing API keys (Claude, OpenAI, Gemini) still work
2. Provider selection works the same way
3. **New:** You can now also use Bedrock with AWS credentials

### If You Used Managed Mode

**Switch to Qognix AI provider:**

1. Make sure you have an active **paid subscription** (PRO or TEAM)
2. Sign in to your Qognix account (Settings → Account → Sign In)
3. In chat, select the **Qognix AI** provider button
4. The Qognix AI button only appears if you have a paid subscription

---

## New Features

### Bedrock (BYOK)
Use AWS Bedrock with your own AWS credentials:

1. Go to Settings → API Keys → Bedrock tab
2. Enter your AWS Access Key, Secret Key, and Region
3. Select Bedrock provider in chat
4. Access Claude, Llama, and Mistral models via AWS

### Qognix AI (Managed)
Use Bedrock without an AWS account:

1. Subscribe to Qognix PRO or TEAM plan
2. Sign in to your Qognix account
3. Select Qognix AI provider in chat
4. No AWS credentials needed - we handle everything

---

## Provider Comparison

| Provider | Mode | Requirements | Models |
|----------|------|--------------|--------|
| **Claude** | BYOK | Anthropic API key | Claude 3.5 Sonnet, Opus, Haiku |
| **OpenAI** | BYOK | OpenAI API key | GPT-4o, GPT-4o-mini, GPT-4 |
| **Gemini** | BYOK | Google API key | Gemini 2.0 Flash, 1.5 Pro |
| **Bedrock** | BYOK | AWS credentials | Claude, Llama, Mistral via AWS |
| **Qognix AI** | Managed | Paid subscription | Same as Bedrock (no AWS account) |

---

## FAQs

### Q: Where did the API Mode selector go?
**A:** It was removed. Mode is now determined automatically based on provider selection.

### Q: Can I still use my own API keys?
**A:** Yes! Claude, OpenAI, Gemini, and Bedrock all use BYOK mode.

### Q: Why don't I see the Qognix AI button?
**A:** Qognix AI is only available to users with paid subscriptions (PRO or TEAM).

### Q: What's the difference between Bedrock and Qognix AI?
**A:** Both use AWS Bedrock:
- **Bedrock (BYOK):** You provide AWS credentials, you pay AWS directly
- **Qognix AI (Managed):** We provide AWS credentials, you pay via Qognix subscription

### Q: Can I use Managed mode with OpenAI or Claude?
**A:** No. Managed mode only works with Qognix AI (which uses Bedrock). For other providers, use BYOK mode.

---

## Troubleshooting

### "Please set your API key"
- You selected a BYOK provider without configuring credentials
- Go to Settings → API Keys and add your API key

### "Please sign in to use Qognix AI"
- You selected Qognix AI without being logged in
- Go to Settings → Account → Sign In

### "Qognix AI button not visible"
- You need a paid subscription (PRO or TEAM)
- Free plan users can only use BYOK providers

---

## Need Help?

- **Documentation:** [docs/BEDROCK_QOGNIX_INTEGRATION.md](BEDROCK_QOGNIX_INTEGRATION.md)
- **Auth Guide:** [docs/AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md)
- **Support:** Contact support@qognix.com
