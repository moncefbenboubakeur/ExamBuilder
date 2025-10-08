-- Seed file for sample questions
-- This creates a sample exam that will be available to all users

-- Insert sample exam (this will be visible to all users via RLS policy)
INSERT INTO exams (id, user_id, name, file_name, description, is_sample, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'Sample Questions - Web Development',
  'sample-questions.md',
  'A collection of sample questions covering HTML, CSS, JavaScript, HTTP, and SQL basics. Perfect for testing the exam simulator!',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (exam_id, question_number, question_text, options, correct_answer, community_vote, has_illustration) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  1,
  'What does HTML stand for?',
  '{"A": "Hyper Text Markup Language", "B": "High Tech Modern Language", "C": "Home Tool Markup Language", "D": "Hyperlinks and Text Markup Language"}',
  'A',
  'A (92%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  2,
  'Which CSS property is used to change the text color?',
  '{"A": "font-color", "B": "text-color", "C": "color", "D": "text-style"}',
  'C',
  'C (88%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  3,
  'What is the correct syntax for referring to an external JavaScript file?',
  '{"A": "<script href=\"app.js\">", "B": "<script name=\"app.js\">", "C": "<script src=\"app.js\">", "D": "<script file=\"app.js\">"}',
  'C',
  'C (95%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  4,
  'Which HTTP method is used to submit data to be processed?',
  '{"A": "GET", "B": "POST", "C": "PUT", "D": "SUBMIT"}',
  'B',
  'B (85%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  5,
  'What does CSS stand for?',
  '{"A": "Creative Style Sheets", "B": "Cascading Style Sheets", "C": "Computer Style Sheets", "D": "Colorful Style Sheets"}',
  'B',
  'B (98%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  6,
  'Which JavaScript method is used to select an element by ID?',
  '{"A": "querySelector()", "B": "getElement()", "C": "getElementById()", "D": "selectById()"}',
  'C',
  'C (90%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  7,
  'What is the default port for HTTP?',
  '{"A": "443", "B": "8080", "C": "3000", "D": "80"}',
  'D',
  'D (87%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  8,
  'Which HTML tag is used for creating a hyperlink?',
  '{"A": "<link>", "B": "<a>", "C": "<href>", "D": "<url>"}',
  'B',
  'B (94%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  9,
  'What is the purpose of the box model in CSS?',
  '{"A": "To create boxes on the page", "B": "To define the space around elements", "C": "To make rounded corners", "D": "To create containers"}',
  'B',
  'B (78%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  10,
  'Which SQL statement is used to retrieve data from a database?',
  '{"A": "GET", "B": "SELECT", "C": "RETRIEVE", "D": "FETCH"}',
  'B',
  'B (96%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  11,
  'Which of these are valid HTTP status codes?',
  '{"A": "200 OK", "B": "404 Not Found", "C": "500 Internal Server Error", "D": "600 Timeout", "E": "301 Moved Permanently", "F": "999 Unknown"}',
  'A,B,C,E',
  'A,B,C,E (88%)',
  false
),
(
  '00000000-0000-0000-0000-000000000001',
  12,
  'What does the acronym API stand for?',
  '{"A": "Application Programming Interface", "B": "Advanced Programming Integration", "C": "Automated Process Integration", "D": "Application Process Interface", "E": "Advanced Process Interface"}',
  'A',
  'A (95%)',
  false
)
ON CONFLICT DO NOTHING;
