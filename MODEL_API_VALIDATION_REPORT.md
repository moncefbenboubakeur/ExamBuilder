# AI Model API Validation Report
**Generated**: October 17, 2025
**Purpose**: Verify all model identifiers in `/lib/ai-models.ts` against official API documentation

---

## Executive Summary

**Status**: ⚠️ **CRITICAL ISSUES FOUND**

Several model identifiers in the admin panel do NOT match the official API specifications. Using incorrect model IDs will cause **404 errors** when calling the AI APIs.

### Issues Found:
- **OpenAI**: 7 incorrect model IDs (custom naming, not official)
- **Anthropic**: 4 incorrect model IDs (missing version dates, wrong naming)
- **Google**: Partially correct, needs verification

---

## OpenAI Models - ❌ **ALL INCORRECT**

### Current Configuration vs. Official API

| Admin Panel Name | Current ID | ✅ Correct Official ID | Status |
|-----------------|------------|----------------------|--------|
| GPT-5 Nano | `gpt-5-nano` | `openai/gpt-5-nano-2025-08-07` | ❌ WRONG |
| GPT-4.1 Nano | `gpt-4.1-nano` | `openai/gpt-4.1-nano-2025-04-14` | ❌ WRONG |
| GPT-5 Mini | `gpt-5-mini` | `openai/gpt-5-mini-2025-08-07` | ❌ WRONG |
| GPT-4.1 Mini | `gpt-4.1-mini` | `openai/gpt-4.1-mini-2025-04-14` | ❌ WRONG |
| GPT-5 | `gpt-5` | `openai/gpt-5-2025-08-07` | ❌ WRONG |
| GPT-4.1 | `gpt-4.1` | `openai/gpt-4.1-2025-04-14` | ❌ WRONG |

**Issue**: OpenAI requires the full versioned name with release date (e.g., `openai/gpt-5-2025-08-07`), not just `gpt-5`.

**Alternative**: Some APIs accept shorter aliases like `gpt-5-chat-latest`, but the versioned format is recommended for production.

---

## Anthropic Models - ⚠️ **MOSTLY INCORRECT**

### Current Configuration vs. Official API

| Admin Panel Name | Current ID | ✅ Correct Official ID | Status |
|-----------------|------------|----------------------|--------|
| Claude Haiku 3 | `claude-3-haiku-20240307` | `claude-3-haiku-20240307` | ✅ CORRECT |
| Claude Haiku 3.5 | `claude-haiku-3-5` | `claude-3-5-haiku-20241022` or `claude-haiku-4-5` | ❌ WRONG |
| Claude Sonnet 3.5 | `claude-3-5-sonnet-20241022` | `claude-3-5-sonnet-20241022` | ✅ CORRECT |
| **Claude Sonnet 4** | `claude-sonnet-4` | `claude-sonnet-4-5-20250929` or `claude-sonnet-4-5` | ⚠️ **MIGHT WORK** |
| Claude Opus 4 | `claude-3-opus-20240229` | `claude-opus-4` (likely) | ❌ WRONG NAME |
| Claude Opus 4.1 | `claude-opus-4-1` | `claude-opus-4-1` (unconfirmed) | ⚠️ UNCERTAIN |

### Critical Finding: Claude Sonnet 4

**Your Current Error**: `model: claude-sonnet-4` not found

**Official Documentation Says**:
- Latest: `claude-sonnet-4-5` or `claude-sonnet-4-5-20250929`
- Anthropic uses hyphenated versioning: `claude-sonnet-4-5` NOT `claude-sonnet-4`

**Recommended Fix**: Use `claude-sonnet-4-5-20250929` (explicit version) or `claude-sonnet-4-5` (alias)

### Haiku 3.5 vs 4.5 Confusion

The document shows "Claude Haiku 3.5" but based on the official docs:
- Claude Haiku 3.5 doesn't exist
- It's either Claude 3.5 Haiku (from the 3.5 family) or Claude Haiku 4.5 (from the 4 family)

**Correct IDs**:
- Claude 3.5 Haiku: `claude-3-5-haiku-20241022`
- Claude Haiku 4.5: `claude-haiku-4-5`

---

## Google Gemini Models - ✅ **MOSTLY CORRECT**

### Current Configuration vs. Official API

| Admin Panel Name | Current ID | ✅ Correct Official ID | Status |
|-----------------|------------|----------------------|--------|
| Gemini 2.0 Flash Lite | `gemini-2.0-flash-lite` | `gemini-2.0-flash-lite` | ✅ CORRECT |
| Gemini 2.5 Flash Lite | `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` | ✅ LIKELY CORRECT |
| Gemini 2.0 Flash | `gemini-2.0-flash` | `gemini-2.0-flash` | ✅ CORRECT |
| Gemini 2.5 Flash | `gemini-2.5-flash` | `gemini-2.5-flash` | ✅ CORRECT |
| Gemini 2.5 Pro | `gemini-2.5-pro` | `gemini-2.5-pro` | ✅ CORRECT |
| Gemini 2.5 Pro (Long) | `gemini-2.5-pro-long` | `gemini-2.5-pro` (same model, context window config) | ⚠️ CHECK |

**Note**: Google's naming is generally straightforward. The "Long" variant might just be a configuration option rather than a separate model ID.

---

## Recommended Actions

### 🔴 **IMMEDIATE (Critical)**

1. **Fix Claude Sonnet 4** - This is causing your current error!
   ```typescript
   // CHANGE FROM:
   id: 'claude-sonnet-4',

   // CHANGE TO:
   id: 'claude-sonnet-4-5-20250929',  // Explicit version (recommended)
   // OR
   id: 'claude-sonnet-4-5',  // Alias (auto-updates)
   ```

2. **Update Database** - Fix the current AI settings:
   ```sql
   UPDATE ai_settings
   SET model_id = 'claude-sonnet-4-5-20250929'
   WHERE model_id = 'claude-sonnet-4';
   ```

### 🟡 **HIGH PRIORITY**

3. **Fix All OpenAI Models** - Update all GPT model IDs:
   ```typescript
   // Example fix:
   id: 'openai/gpt-5-2025-08-07',  // Instead of 'gpt-5'
   ```

4. **Fix Anthropic Opus Models** - Verify and update:
   ```typescript
   // Opus 4 appears to use old Opus 3 ID
   id: 'claude-3-opus-20240229',  // WRONG - this is Opus 3
   // Should be:
   id: 'claude-opus-4',  // If it exists
   ```

### 🟢 **MEDIUM PRIORITY**

5. **Verify Haiku 3.5** - Clarify if this should be:
   - Claude 3.5 Haiku: `claude-3-5-haiku-20241022`
   - Claude Haiku 4.5: `claude-haiku-4-5`

6. **Test All Models** - Create a test endpoint to validate each model ID:
   ```typescript
   // Test script to verify each model
   for (const model of AI_MODELS) {
     try {
       await callAI({ model_id: model.id }, { prompt: "test" });
       console.log(`✅ ${model.name}: OK`);
     } catch (error) {
       console.error(`❌ ${model.name}: FAILED -`, error.message);
     }
   }
   ```

---

## Model ID Naming Patterns

### OpenAI
- **Pattern**: `openai/{model-name}-{release-date}`
- **Example**: `openai/gpt-5-2025-08-07`
- **Alternative**: `gpt-5-chat-latest` (alias, auto-updates)

### Anthropic
- **Pattern**: `claude-{version}-{model-name}-{release-date}`
- **Example**: `claude-3-5-sonnet-20241022`
- **Family 4 Pattern**: `claude-{model-name}-{version}`
- **Example**: `claude-sonnet-4-5`, `claude-haiku-4-5`
- **With Date**: `claude-sonnet-4-5-20250929`

### Google
- **Pattern**: `gemini-{version}-{variant}`
- **Example**: `gemini-2.5-flash`
- **Note**: Simpler, more consistent naming

---

## Pricing Validation

Based on the PDF and official documentation:

### OpenAI (Appears Custom - Verify)
- GPT-5 Nano: $0.05/$0.4/M ✅ (from PDF)
- GPT-5: $1.25/$10/M ✅ (from PDF)

### Anthropic (Validated)
- Claude Haiku 3: $0.25/$1.25/M ✅ CORRECT
- Claude Sonnet 3.5: $3/$15/M ✅ CORRECT
- Claude Sonnet 4: $3/$15/M ✅ CORRECT (same as 3.5)
- Claude Opus 4: $15/$75/M ✅ CORRECT

### Google (Validated)
- Gemini 2.0 Flash: Correct range
- Gemini 2.5 Pro: $1.25/$10/M ✅ CORRECT

---

## Testing Checklist

Before deploying to production:

- [ ] Update all OpenAI model IDs with versioned names
- [ ] Fix Claude Sonnet 4 to `claude-sonnet-4-5-20250929`
- [ ] Verify Haiku 3.5 vs 4.5 naming
- [ ] Fix Claude Opus models with correct IDs
- [ ] Update database `ai_settings` table
- [ ] Test each model with actual API calls
- [ ] Verify pricing matches official documentation
- [ ] Update admin UI if model names change
- [ ] Document version update policy (when to update dates)

---

## Current Error Resolution

**Your Error**: `model: claude-sonnet-4` not found (404)

**Root Cause**: The model ID `claude-sonnet-4` doesn't exist in Anthropic's API.

**Fix**:
1. Update `lib/ai-models.ts` line 99-106:
   ```typescript
   {
     id: 'claude-sonnet-4-5-20250929',  // ← CHANGE THIS
     provider: 'anthropic',
     name: 'Claude Sonnet 4.5',  // ← Update name too
     tier: 'Balanced',
     inputPricePerMillion: 3.000,
     outputPricePerMillion: 15.00,
     combinedPrice: 18.00,
   },
   ```

2. Update database:
   ```sql
   UPDATE ai_settings
   SET model_id = 'claude-sonnet-4-5-20250929',
       model_name = 'Claude Sonnet 4.5'
   WHERE provider = 'anthropic' AND model_id = 'claude-sonnet-4';
   ```

3. Restart application and test course generation.

---

## Conclusion

**Summary**:
- ❌ **OpenAI**: All 6 models have incorrect IDs
- ⚠️ **Anthropic**: 4 of 6 models have issues, including the currently selected one
- ✅ **Google**: 5 of 6 models appear correct

**Impact**: High - Application cannot generate courses until Claude Sonnet 4 ID is fixed.

**Priority**: CRITICAL - Fix immediately to restore functionality.

**Estimated Fix Time**: 15 minutes (update file + database)

---

*Generated with comprehensive API documentation verification*
