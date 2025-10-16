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

export type AIAnalysis = {
  id: string;
  question_id: string;
  ai_recommended_answer: string;
  ai_confidence_score: number;
  option_short_explanations: Record<string, string>;
  option_long_explanations: Record<string, string>;
  reasoning_summary: string;
  reasoning_detailed: string;
  analyzed_at: string;
  created_at: string;
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
  ai_analysis?: AIAnalysis | AIAnalysis[] | null; // Optional - may not exist for old questions
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
  shuffled_question_order: string[] | null;
  shuffled_options_map: Record<string, Record<string, string>> | null;
};

export type ExamAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: string;
};

export type ExamShare = {
  id: string;
  exam_id: string;
  shared_by: string;
  shared_with: string;
  created_at: string;
};

export type ExamWithSharing = Exam & {
  is_shared_with_me?: boolean;
  shared_by_email?: string;
};

export type StudyProgress = {
  id: string;
  user_id: string;
  exam_id: string;
  topic_name: string;
  completed: boolean;
  last_visited_at: string;
  created_at: string;
};

export type StudyProgressStatistics = {
  total_topics: number;
  completed_topics: number;
  completion_percentage: number;
  last_visited_topic: {
    topic_name: string;
    visited_at: string;
  } | null;
};

export type UserPreferences = {
  user_id: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  created_at: string;
  updated_at: string;
};
