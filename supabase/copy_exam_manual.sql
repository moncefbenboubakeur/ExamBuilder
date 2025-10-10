-- Manual SQL Script to Copy Exam Between Users
-- This script copies an exam and all its questions from one user to another

-- Step 1: Set your variables here
-- Replace these values with actual data:
-- source_user_email: Email of the user who owns the exam (monceftab@gmail.com)
-- target_user_email: Email of the user who will receive the copy (medkirati@gmail.com)
-- exam_name_to_copy: Name of the exam to copy (Cloud Digital Leader Exam)

DO $$
DECLARE
  source_user_id UUID;
  target_user_id UUID;
  source_exam_id UUID;
  new_exam_id UUID;
  source_user_email TEXT := 'monceftab@gmail.com';
  target_user_email TEXT := 'medkirati@gmail.com';
  exam_name_to_copy TEXT := 'Cloud Digital Leader Exam';
BEGIN
  -- Get source user ID
  SELECT id INTO source_user_id
  FROM auth.users
  WHERE email = source_user_email;

  IF source_user_id IS NULL THEN
    RAISE EXCEPTION 'Source user with email % not found', source_user_email;
  END IF;

  -- Get target user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user with email % not found', target_user_email;
  END IF;

  -- Get source exam ID
  SELECT id INTO source_exam_id
  FROM exams
  WHERE user_id = source_user_id
  AND name = exam_name_to_copy;

  IF source_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam "%" not found for user %', exam_name_to_copy, source_user_email;
  END IF;

  -- Copy the exam
  INSERT INTO exams (user_id, name, file_name, description, is_sample)
  SELECT target_user_id, name, file_name, description, false
  FROM exams
  WHERE id = source_exam_id
  RETURNING id INTO new_exam_id;

  -- Copy all questions
  INSERT INTO questions (exam_id, question_number, question_text, options, correct_answer, community_vote, has_illustration)
  SELECT new_exam_id, question_number, question_text, options, correct_answer, community_vote, has_illustration
  FROM questions
  WHERE exam_id = source_exam_id;

  RAISE NOTICE 'Successfully copied exam "%" from % to %', exam_name_to_copy, source_user_email, target_user_email;
  RAISE NOTICE 'New exam ID: %', new_exam_id;
  RAISE NOTICE 'Questions copied: %', (SELECT COUNT(*) FROM questions WHERE exam_id = new_exam_id);
END $$;
