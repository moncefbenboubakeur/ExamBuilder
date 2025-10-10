---
description: Convert a PDF exam file into markdown format for the exam platform
---

Convert this PDF exam to markdown format for upload to the exam platform.

Process:
1. Create a project folder in `projects/[exam-name]/`
2. Split the PDF into smaller chunks of ~10 pages each using qpdf
3. Extract questions from each chunk sequentially using AI/OCR
4. Format each question into this exact markdown table structure:

```markdown
| Question # | Question | Options (A–D) | Correct Answer | Community Vote | Has Illustration |
```

5. Append all extracted questions to a single .md file in the project folder
6. Review the final markdown file for any formatting issues

Requirements:
- Each question must be numbered sequentially
- Options should be separated by `<br/>` tags
- Extract all option letters (A, B, C, D, E, F, etc.) as found in the PDF
- Correct Answer should be the letter(s) only
- Community Vote can be extracted if present, otherwise leave empty
- Has Illustration should be "Yes" or "No"
- Preserve question text exactly as written in PDF

Expected output:
- A folder `projects/[exam-name]/` with split PDFs
- A single `[exam-name].md` file with all questions in the correct table format
- Ready to upload via the exam upload feature

Ask the user for:
1. The path to the PDF file
2. The exam name to use for the project folder
