-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  is_sample BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  community_vote TEXT,
  has_illustration BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0
);

-- Exam answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(question_number);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_session ON exam_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_question ON exam_answers(question_id);

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams (users can view their own exams + sample exams)
CREATE POLICY "Users can view own exams and sample exams"
  ON exams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_sample = true);

CREATE POLICY "Users can insert own exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
  ON exams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_sample = false);

-- RLS Policies for questions (readable by all authenticated users)
CREATE POLICY "Questions are viewable by authenticated users"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are insertable by authenticated users"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for exam_sessions (users can only see their own sessions)
CREATE POLICY "Users can view own exam sessions"
  ON exam_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions"
  ON exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions"
  ON exam_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for exam_answers (users can only see answers for their sessions)
CREATE POLICY "Users can view own exam answers"
  ON exam_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exam answers"
  ON exam_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exam answers"
  ON exam_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );
