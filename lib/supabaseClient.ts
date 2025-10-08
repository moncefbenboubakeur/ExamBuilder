import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Exam = {
  id: string;
  user_id: string | null;
  name: string;
  file_name: string | null;
  description: string | null;
  is_sample: boolean;
  created_at: string;
  question_count?: number; // Virtual field from join/count
};

export type Question = {
  id: string;
  exam_id: string;
  question_number: number;
  question_text: string;
  options: Record<string, string>; // Dynamic options (A, B, C, D, E, F, etc.)
  correct_answer: string;
  community_vote: string;
  has_illustration: boolean;
  created_at: string;
};

export type ExamSession = {
  id: string;
  user_id: string;
  exam_id: string;
  created_at: string;
  completed: boolean;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  elapsed_time: number;
};

export type ExamAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: string;
};
