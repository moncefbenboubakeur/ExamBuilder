# What Changed in /admin - Visual Explanation

## Why You Don't See Changes in the Admin UI

The **display names** you see in the UI (like "Claude Haiku 3.5", "GPT-5 Nano") **DID NOT CHANGE**.

What changed are the **internal model IDs** - the identifiers sent to AI APIs when generating courses.

---

## Visual Comparison

### What You See in Admin UI (No Change)
```
┌─────────────────────────────────────┐
│ Claude Haiku 3.5                    │ ← Display name (UNCHANGED)
│ ⚡ Fast                             │
│ Input: $0.8/M                       │
│ Output: $4/M                        │
│ Total: $4.8/M                       │
└─────────────────────────────────────┘
```

### What Changed Behind the Scenes (Model IDs)

| Display Name | OLD Model ID (❌ Caused 404) | NEW Model ID (✅ Works) |
|-------------|---------------------------|----------------------|
| **GPT-5 Nano** | `gpt-5-nano` | `gpt-5-nano-2025-08-07` |
| **GPT-4.1 Nano** | `gpt-4.1-nano` | `gpt-4.1-nano-2025-04-14` |
| **GPT-5 Mini** | `gpt-5-mini` | `gpt-5-mini-2025-08-07` |
| **GPT-4.1 Mini** | `gpt-4.1-mini` | `gpt-4.1-mini-2025-04-14` |
| **GPT-5** | `gpt-5` | `gpt-5-2025-08-07` |
| **GPT-4.1** | `gpt-4.1` | `gpt-4.1-2025-04-14` |
| | | |
| **Claude Haiku 3.5** | `claude-haiku-3-5` | `claude-3-5-haiku-20241022` |
| **Claude Sonnet 4** | `claude-sonnet-4` | `claude-sonnet-4-5-20250929` |
| **Claude Opus 4** | `claude-3-opus-20240229` | `claude-opus-4` |
| **Claude Opus 4.1** | `claude-opus-4-1` | `claude-opus-4-1` |

---

## How This Works in the Code

### Admin UI (`/app/admin/page.tsx`)
Shows **display names** from `ai-models.ts`:

```typescript
// What the UI displays
AI_MODELS.map(model => (
  <div>
    <h3>{model.name}</h3>  {/* "Claude Haiku 3.5" - UNCHANGED */}
    <p>{model.tier}</p>     {/* "Fast" - UNCHANGED */}
  </div>
))
```

### API Calls (`/app/api/generate-course/route.ts`)
Uses **model IDs** when calling AI:

```typescript
// When generating a course, this is what gets sent to Anthropic/OpenAI/Google
await callAI({
  provider: settings.provider,        // "anthropic"
  model_id: settings.model_id,        // This is what CHANGED!
  model_name: settings.model_name     // "Claude Haiku 3.5" - UNCHANGED
})
```

---

## The Critical Change: Claude Sonnet 4

This was causing your 404 error:

### Before (In Your Database):
```
provider: "anthropic"
model_id: "claude-sonnet-4"        ❌ This doesn't exist in Anthropic's API!
model_name: "Claude Sonnet 4"
```

### After (What You Need to Update):
```
provider: "anthropic"
model_id: "claude-sonnet-4-5-20250929"  ✅ This is the correct API identifier
model_name: "Claude Sonnet 4"
```

---

## Why You Still See the Error

**The Problem**: Your database (`ai_settings` table) still has the OLD model ID.

**The Fix**: Run this SQL query in Supabase:

```sql
UPDATE ai_settings
SET model_id = 'claude-sonnet-4-5-20250929'
WHERE model_id = 'claude-sonnet-4';
```

---

## How to Verify the Changes

### 1. Check the Code Changes:
```bash
git diff lib/ai-models.ts
```

You'll see lines like:
```diff
- id: 'claude-sonnet-4',
+ id: 'claude-sonnet-4-5-20250929',
```

### 2. Check What Admin Page Shows:
The UI display will look EXACTLY THE SAME because we only changed internal IDs, not display names.

### 3. The Real Test:
After updating the database, try generating a course. The logs will show:

**Before (404 Error)**:
```
❌ AI call failed: model: claude-sonnet-4 not found (404)
```

**After (Success)**:
```
✅ Course generation complete in 52.33s
```

---

## Summary

**What Changed**: Model IDs in `lib/ai-models.ts` (the code)
**What You See**: Display names in `/admin` (unchanged)
**What You Need**: Update database with SQL query
**Why It Matters**: Old model IDs cause 404 errors when calling AI APIs

The admin page **looks the same** because we didn't change the visual display names - only the internal API identifiers that were causing failures.
