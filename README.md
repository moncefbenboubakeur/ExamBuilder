# ExamBuilder.net - Markdown-Based Testing Platform

A modern web application for uploading and taking exams from Markdown files. Built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- **File Upload**: Upload `.md` files containing exam questions in table format
- **Interactive Exam**: Take exams question-by-question with instant feedback
- **Progress Tracking**: Visual progress bar and answer tracking
- **Results & Analytics**: Detailed statistics with score breakdown
- **Retry Options**: Retry all questions or only incorrect ones
- **Authentication**: Secure login with Supabase Magic Link
- **Session Management**: Track exam history and performance

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Parser**: Remark, Remark-GFM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
cd exambuilder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase/schema.sql`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Markdown Format

Upload `.md` files with questions in this table format:

```markdown
| Question # | Question | Options (A–D) | Correct Answer | Community Vote | Has Illustration |
|------------|----------|---------------|----------------|----------------|------------------|
| 1 | What is 2+2? | A. 3<br/>B. 4<br/>C. 5<br/>D. 6 | B | B (85%) | No |
| 2 | What is the capital of France? | A. London<br/>B. Paris<br/>C. Berlin<br/>D. Madrid | B | B (92%) | No |
```

### Table Columns:
- **Question #**: Question number (integer)
- **Question**: The question text
- **Options (A–D)**: Multiple choice options separated by `<br/>` or newlines
- **Correct Answer**: The correct answer letter (A, B, C, or D)
- **Community Vote**: Optional community voting statistics
- **Has Illustration**: Whether the question has an illustration (Yes/No)

## Usage

1. **Login**: Sign in with your email using Magic Link
2. **Upload**: Upload a markdown file with exam questions
3. **Start Exam**: Click "Start Exam" to begin
4. **Take Exam**:
   - Answer questions one by one
   - Click "Show Answer" to reveal the correct answer
   - Navigate with Previous/Next buttons
5. **View Results**: See your score and statistics
6. **Retry**: Choose to retry all questions or only incorrect ones

## Project Structure

```
exambuilder/
├── app/
│   ├── api/              # API routes
│   │   ├── upload/       # File upload endpoint
│   │   ├── questions/    # Questions CRUD
│   │   └── session/      # Session management
│   ├── exam/             # Exam pages
│   │   └── results/      # Results page
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home/dashboard
├── components/           # React components
│   ├── FileUpload.tsx
│   ├── QuestionCard.tsx
│   ├── ExamProgress.tsx
│   ├── ExamStats.tsx
│   ├── NavigationButtons.tsx
│   └── ResultScreen.tsx
├── lib/                  # Utilities
│   ├── supabaseClient.ts
│   ├── parseMarkdown.ts
│   ├── examLogic.ts
│   └── utils.ts
└── supabase/
    └── schema.sql        # Database schema
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload and parse markdown file |
| `/api/questions` | GET | Retrieve questions |
| `/api/session/start` | POST | Start exam session |
| `/api/session/answer` | POST | Save user answer |
| `/api/session/finish` | POST | Finalize and compute score |
| `/api/session/stats` | GET | Get user statistics |

## Database Schema

### Tables

**questions**
- `id` (uuid, primary key)
- `question_number` (integer)
- `question_text` (text)
- `options` (jsonb)
- `correct_answer` (text)
- `community_vote` (text)
- `has_illustration` (boolean)
- `created_at` (timestamp)

**exam_sessions**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `created_at` (timestamp)
- `completed` (boolean)
- `score` (integer)
- `total_questions` (integer)
- `correct_count` (integer)
- `wrong_count` (integer)

**exam_answers**
- `id` (uuid, primary key)
- `session_id` (uuid, foreign key)
- `question_id` (uuid, foreign key)
- `selected_answer` (text)
- `is_correct` (boolean)
- `created_at` (timestamp)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Features Roadmap

- [ ] Image upload for illustrated questions
- [ ] Advanced analytics dashboard
- [ ] Leaderboards
- [ ] Question tagging and categories
- [ ] Timed exams
- [ ] PDF export of results
- [ ] Offline mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Author

Built with Claude Code by Sammy

## Support

For issues and questions, please open an issue on GitHub.
