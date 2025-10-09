# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExamBuilder.net - A Next.js 15 exam platform that allows users to upload markdown files containing questions in table format, take exams, and track their performance. Built with Supabase for authentication and data storage.

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **clsx + tailwind-merge** - Utility for conditional class names

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (magic link + password)
  - Row Level Security (RLS)
- **@supabase/ssr** - Supabase SSR integration

### State Management
- **Zustand** - Client-side state management
- **React Hooks** - Local component state

### Build Tools & Development
- **Turbopack** - Next.js bundler (enabled via `--turbo` flag)
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **remark + remark-gfm** - Markdown parsing (GitHub Flavored Markdown)

### Deployment & Infrastructure
- **Vercel** - Hosting platform
- **GitHub** - Version control and CI/CD

### Database Architecture
- 4 main tables: `exams`, `questions`, `exam_sessions`, `exam_answers`
- UUID primary keys
- JSONB for dynamic question options
- Row Level Security (RLS) policies for data isolation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (uses Turbopack on port 3003)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Authentication Flow

- Uses Supabase SSR authentication with middleware-based session management
- **Middleware** (`middleware.ts`): Validates sessions and redirects unauthenticated users from protected routes (`/exam`, `/dashboard`)
- **Client-side**: Uses `@supabase/ssr` with `createBrowserClient` (in `lib/supabaseClient.ts`)
- **Server-side**: Uses `createServerClient` with Next.js cookies (in `lib/supabase-server.ts`)
- Protected routes automatically redirect to `/login` if user not authenticated

### Database Architecture

Four main tables with Row Level Security (RLS) policies:

1. **exams**: Stores exam metadata
   - Users can view their own exams + sample exams (`is_sample = true`)
   - Cascading deletes to questions when exam is deleted

2. **questions**: Stores individual questions
   - Linked to exams via `exam_id` foreign key
   - `options` field is JSONB supporting dynamic option keys (A, B, C, D, E, F, etc.)
   - All authenticated users can view questions

3. **exam_sessions**: Tracks exam attempts
   - Users can only view/modify their own sessions
   - Stores scores, timing, and completion status

4. **exam_answers**: Individual answers within sessions
   - RLS enforces users can only access answers for their own sessions
   - Uses subquery to validate session ownership

All tables use UUID primary keys and have performance indexes on foreign keys and common query fields.

### Markdown Parsing

Two parsers in `lib/parseMarkdown.ts`:

1. **parseMarkdownTable**: Simple line-by-line parser for tables
2. **parseMarkdownWithRemark**: Uses remark + remark-gfm for robust AST-based parsing

Expected table format:
```markdown
| Question # | Question | Options (A–D) | Correct Answer | Community Vote | Has Illustration |
```

Options support dynamic letters (A-Z) separated by `<br/>` or newlines. Parser extracts options into JSONB object with letter keys.

### API Routes Pattern

API routes follow server-side authentication pattern:

```typescript
const supabase = await createClient(); // from lib/supabase-server.ts
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Key endpoints:
- `/api/upload`: Parses markdown → creates exam + questions
- `/api/session/start`: Creates exam_sessions record
- `/api/session/answer`: Saves individual answers
- `/api/session/finish`: Finalizes session with score calculation

### State Management

Uses Zustand for client-side state management (see dependencies in package.json).

### Type Safety

TypeScript types defined in `lib/supabaseClient.ts`:
- `Exam`: Exam metadata with optional `question_count` virtual field
- `Question`: Includes dynamic `options: Record<string, string>`
- `ExamSession`: Session tracking with scores and timing
- `ExamAnswer`: Individual answer records

## Key Implementation Details

### Running the Database Schema

The complete schema is in `supabase/schema.sql`. Must be run in Supabase SQL Editor before app will work. Creates tables, indexes, RLS policies, and enables UUID extension.

### Session Management

Sessions track:
- Start time (`created_at`)
- Completion status (`completed`)
- Score calculation (`score`, `total_questions`, `correct_count`, `wrong_count`)
- Time elapsed (`elapsed_time`)

### Authentication Gotchas

- Middleware runs on all routes except static assets (see `config.matcher` in middleware.ts)
- Login page redirects authenticated users to home
- Server components must use `createClient()` from `lib/supabase-server.ts`
- Client components use `supabase` from `lib/supabaseClient.ts`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
