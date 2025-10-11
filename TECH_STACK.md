# Tech Stack

## Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **clsx + tailwind-merge** - Utility for conditional class names

## Backend
- **Next.js API Routes** - Server-side endpoints
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (magic link + password)
  - Row Level Security (RLS)
- **@supabase/ssr** - Supabase SSR integration

## State Management
- **Zustand** - Client-side state management
- **React Hooks** - Local component state

## Build Tools & Development
- **Turbopack** - Next.js bundler (enabled via `--turbo` flag)
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **remark + remark-gfm** - Markdown parsing (GitHub Flavored Markdown)

## Deployment & Infrastructure
- **Vercel** - Hosting platform
- **GitHub** - Version control and CI/CD

## Database Architecture
- 4 main tables: `exams`, `questions`, `exam_sessions`, `exam_answers`
- UUID primary keys
- JSONB for dynamic question options
- Row Level Security (RLS) policies for data isolation
