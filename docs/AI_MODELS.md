# AI Models Configuration

**Date:** November 29, 2024  
**Status:** ✅ Fixed Models

---

## Default Models

Qognix uses the best available model from each AI provider for optimal SQL generation quality.

### 🤖 Current Models

| Provider | Model | Version | Notes |
|----------|-------|---------|-------|
| **Claude** | `claude-3-5-sonnet-20241022` | 3.5 Sonnet | Latest, best for SQL |
| **OpenAI** | `gpt-4o` | GPT-4o | Best GPT model |
| **Gemini** | `gemini-2.5-flash` | 2.5 Flash | Latest, fastest |

---

## Why These Models?

### Claude 3.5 Sonnet (20241022)
- ✅ **Latest version** (October 2024)
- ✅ **Best for code generation** including SQL
- ✅ **High accuracy** for complex queries
- ✅ **Good balance** of speed and quality
- 💰 **Pricing:** $3/M input, $15/M output tokens

### GPT-4o
- ✅ **Latest GPT-4 model** (optimized)
- ✅ **Excellent SQL understanding**
- ✅ **Fast response times**
- ✅ **Reliable and consistent**
- 💰 **Pricing:** $2.50/M input, $10/M output tokens

### Gemini 2.5 Flash
- ✅ **Latest Gemini version** (2.5)
- ✅ **Fastest response times**
- ✅ **Good quality for SQL**
- ✅ **Free tier available**
- 💰 **Pricing:** Free tier, then pay-as-you-go

---

## Model Selection Strategy

### Why Fixed Models?

1. **Consistency** - All users get the same quality
2. **Simplicity** - No need to choose models
3. **Optimization** - We pick the best model for SQL
4. **Testing** - Easier to test and improve prompts

### Model Selection Now Available!

**Update:** As of November 29, 2024, users can now customize models in Settings!

✅ **Benefits:**
- Power users can use specific models
- Test new models as they're released
- Use cheaper models for simple queries
- Use more powerful models for complex tasks

✅ **How to Change Models:**
1. Open Settings (from sidebar)
2. Scroll to "AI Settings"
3. Enter model name for each provider
4. Examples:
   - Claude: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
   - Gemini: `gemini-2.5-flash`, `gemini-1.5-pro`

---

## Model Comparison

### SQL Generation Quality

| Model | Accuracy | Speed | Cost | Overall |
|-------|----------|-------|------|---------|
| Claude 3.5 Sonnet | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **Best** |
| GPT-4o | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **Excellent** |
| Gemini 2.5 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Great** |

### Use Cases

**Claude 3.5 Sonnet:**
- Complex SQL queries
- Multi-table joins
- Advanced analytics
- Data modeling

**GPT-4o:**
- Fast, reliable queries
- Good for all use cases
- Consistent results
- Best overall balance

**Gemini 2.5 Flash:**
- Quick queries
- Simple analytics
- Cost-effective
- Free tier option

---

## Implementation

### Backend Code

Each provider has a fixed `default_model`:

```python
# claude_provider.py
self.default_model = "claude-3-5-sonnet-20241022"

# openai_provider.py
self.default_model = "gpt-4o"

# gemini_provider.py
self.default_model = "gemini-2.5-flash"
```

### Request Handling

```python
# In chat() method
model = request.model or self.default_model
```

If no model is specified in the request, the default is used.

---

## Model Updates

### When to Update Models?

1. **New major version** released (e.g., Claude 4.0)
2. **Significant performance improvement**
3. **Better pricing** for same quality
4. **Deprecation** of current model

### Update Process

1. Test new model with sample queries
2. Compare quality with current model
3. Check pricing changes
4. Update `default_model` in provider
5. Update documentation
6. Announce to users

---

## Pricing Breakdown

### Cost per 1,000 Queries

Assuming average query:
- Input: ~1,500 tokens (schema + question)
- Output: ~200 tokens (SQL + explanation)

| Provider | Cost per Query | Cost per 1K Queries |
|----------|----------------|---------------------|
| Claude 3.5 Sonnet | $0.0075 | $7.50 |
| GPT-4o | $0.0058 | $5.80 |
| Gemini 2.5 Flash | Free tier | ~$0-2.00 |

---

## Future Considerations

### Possible Features:

1. **Model Selection** (Advanced Settings)
   - For power users who want control
   - Hidden by default
   - Warning about quality variance

2. **Auto Model Selection**
   - Simple queries → Faster/cheaper model
   - Complex queries → Better/slower model
   - Based on query complexity analysis

3. **Custom Models**
   - For enterprise users
   - Fine-tuned models
   - Private deployments

---

## FAQ

### Q: Can I use a different model?
**A:** Yes! Go to Settings > AI Settings and enter the model name you want to use.

### Q: Why not use cheaper models?
**A:** Quality is more important than cost for SQL generation. Wrong SQL can be expensive!

### Q: How do I know which model to use?
**A:** Stick with the defaults unless you have a specific reason to change. The defaults are optimized for SQL generation.

### Q: What if a model is deprecated?
**A:** We'll update to the recommended replacement model automatically.

### Q: Can I use older Claude models?
**A:** No, we only use the latest Claude 3.5 Sonnet for best results.

---

## Model Changelog

### 2024-11-29 (Update 2)
- ✅ Added model selection in Settings
- ✅ Users can now specify custom models for each provider
- ✅ Default models remain: Claude 3.5 Sonnet, GPT-4o, Gemini 2.5 Flash
- ✅ Model field passed through entire stack (frontend → backend → AI provider)

### 2024-11-29 (Update 1)
- ✅ Set Claude to `claude-3-5-sonnet-20241022`
- ✅ Changed OpenAI from `gpt-4o-mini` to `gpt-4o`
- ✅ Set Gemini to `gemini-2.5-flash`
- ✅ Documented model selection strategy

### Future Updates
- Will be documented here as models are updated

---

## Summary

**Current Strategy:**
- ✅ Fixed models per provider
- ✅ Best quality for SQL generation
- ✅ No user configuration needed
- ✅ Consistent experience

**Models:**
- 🤖 Claude: `claude-3-5-sonnet-20241022`
- 🤖 OpenAI: `gpt-4o`
- 🤖 Gemini: `gemini-2.5-flash`

---

**All models configured for optimal SQL generation!** 🎯

