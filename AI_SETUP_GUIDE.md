# AI Answer Explanations - Setup Guide

## Implementation Complete! ✅

All code has been written and is ready to use. Follow these steps to enable AI-powered answer explanations.

---

## Step 1: Run Database Migration

The AI feature requires a new database table. Run this migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/001_add_ai_analysis.sql`
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run**

This creates the `question_ai_analysis` table with proper indexes and RLS policies.

---

## Step 2: Add Anthropic API Key

### Get Your API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### Add to Environment Variables

Open `.env.local` and add:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

**Important:** Never commit `.env.local` to git! The key should remain secret.

---

## Step 3: Restart Development Server

Kill any running dev servers and restart:

```bash
# Kill existing servers (if running)
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start fresh
npm run dev
```

---

## How It Works

### Upload Flow

1. **User uploads markdown** with exam questions
2. **Questions are saved** to database
3. **AI analysis is triggered** automatically in the background
4. **AI independently analyzes** each question (without seeing "correct answer")
5. **Results are stored** in `question_ai_analysis` table

### Taking Exam Flow

1. **User takes exam** normally
2. **User clicks "Show Answer"**
3. **Three expert opinions** are displayed:
   - 📝 **Exam Creator's Answer** (from markdown)
   - 👥 **Community Vote** (from markdown)
   - 🤖 **AI Analysis** (independent AI determination)
4. **Short explanations** appear under each option
5. **"Learn More"** expands detailed explanations
6. **"Show Full AI Reasoning"** opens modal with complete analysis

---

## Testing the Feature

### 1. Upload a Test Exam

Create a simple markdown file (`test-exam.md`):

```markdown
| Question # | Question | Options (A–D) | Correct Answer | Community Vote | Has Illustration |
|------------|----------|---------------|----------------|----------------|------------------|
| 1 | What is 2+2? | A. 3<br/>B. 4<br/>C. 5<br/>D. 6 | B | B | false |
```

### 2. Upload via UI

- Go to your app's upload page
- Upload `test-exam.md`
- Wait for success message

### 3. Check AI Analysis (Optional)

In Supabase Dashboard → Table Editor → `question_ai_analysis`:
- You should see a new record
- Check `ai_recommended_answer`, `option_short_explanations`, etc.

### 4. Take the Exam

- Navigate to the exam
- Answer the question
- Click **"Show Answer"**
- Verify you see:
  - Three expert opinions (Exam Creator, Community, AI)
  - Short explanations under each option
  - "Learn More" buttons
  - "Show Full AI Reasoning" button

---

## Troubleshooting

### No AI Analysis Appearing

**Check 1: Is API key set?**
```bash
# Check if key exists
grep ANTHROPIC_API_KEY .env.local
```

**Check 2: Check server logs**
```bash
# Look for errors in terminal where dev server is running
# Should see "AI analysis queued" in upload response
```

**Check 3: Check Supabase table**
```sql
-- In Supabase SQL Editor
SELECT * FROM question_ai_analysis LIMIT 10;
```

If empty, AI analysis endpoint might have failed. Check:
- API key is valid
- API key has credits
- No firewall blocking Anthropic API

### AI Analysis Failed

**Check API endpoint logs:**
- Look for errors in `/api/ai/analyze-questions` calls
- Common issues:
  - Invalid API key
  - Rate limiting
  - Network issues
  - Malformed JSON responses

**Re-trigger analysis manually:**

You can call the endpoint directly for existing questions:

```bash
# Get question IDs
curl http://localhost:3000/api/questions?exam_id=YOUR_EXAM_ID

# Trigger analysis
curl -X POST http://localhost:3000/api/ai/analyze-questions \
  -H "Content-Type: application/json" \
  -d '{"questionIds":["question-id-1","question-id-2"], "examId":"exam-id"}'
```

### Sources Always Agree

This is actually **good**! It means:
- Exam creator's answer is correct
- Community voted correctly
- AI determined the correct answer independently

The warning only appears when there's disagreement, which helps identify:
- Bad questions
- Outdated information
- Controversial answers

---

## Cost Information

### Per-Question Cost

With Claude 3.5 Sonnet:
- ~500 input tokens
- ~800 output tokens
- **~$0.005 per question**

### Example Costs

- 10 questions: ~$0.05
- 100 questions: ~$0.50
- 1,000 questions: ~$5.00

### Cost Optimization

✅ **Already optimized!**
- AI runs ONCE per question during upload
- Results stored permanently
- Zero AI tokens consumed during exam taking
- Users can view explanations unlimited times

---

## Feature Highlights

### For Users

✅ **Three independent expert opinions** on every question
✅ **Instant short explanations** for quick understanding
✅ **Detailed technical analysis** on demand
✅ **Full AI reasoning** with comprehensive breakdown
✅ **Disagreement warnings** when sources conflict
✅ **Learn why, not just what** - transforms memorization into understanding

### For Exam Quality

✅ **Identifies bad questions** (when sources disagree)
✅ **Catches outdated content** (AI has current knowledge)
✅ **Validates community votes** (third-party verification)
✅ **Improves learning outcomes** (explanations help retention)

---

## Next Steps

### Optional Enhancements

1. **Analyze existing questions**
   - Create endpoint to trigger AI analysis for old exams
   - Batch process all questions without AI analysis

2. **Add regeneration**
   - Allow admin to re-trigger AI analysis for specific questions
   - Useful if AI makes mistakes or question is updated

3. **Add analytics**
   - Track when users expand detailed explanations
   - Measure learning engagement
   - Identify confusing questions (high expansion rate)

4. **Multilingual support**
   - Generate explanations in multiple languages
   - Store in separate columns: `reasoning_summary_es`, etc.

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review `/AI_EXPLANATIONS_FEATURE_PLAN.md` for technical details
3. Check Anthropic API status: https://status.anthropic.com/
4. Verify Supabase connection and RLS policies

---

## Success Checklist

- [ ] Database migration completed
- [ ] `ANTHROPIC_API_KEY` added to `.env.local`
- [ ] Dev server restarted
- [ ] Test exam uploaded
- [ ] AI analysis completed (check database)
- [ ] "Show Answer" displays three expert opinions
- [ ] Short explanations visible
- [ ] "Learn More" expands detailed explanations
- [ ] "Show Full AI Reasoning" modal works
- [ ] Disagreement warning appears (if applicable)

---

**Congratulations!** 🎉 Your exam platform now has AI-powered explanations that help users learn, not just memorize!
