import { GenerateRequest } from './schemas'

export const SYSTEM_PROMPT = `You are a senior QA engineer with expertise in creating comprehensive test cases from user stories. Your task is to analyze user stories and generate detailed test cases.

CRITICAL: You must return ONLY valid JSON matching this exact schema:

{
  "cases": [
    {
      "id": "TC-001",
      "title": "string",
      "steps": ["string", "..."],
      "testData": "string (optional)",
      "expectedResult": "string",
      "category": "string (e.g., Positive|Negative|Edge|Authorization|Non-Functional)"
    }
  ],
  "model": "string (optional)",
  "promptTokens": 0,
  "completionTokens": 0
  ,"note": "string (optional - explain if fewer/more tests were generated than requested)"
}

Instructions:
- Generate test case IDs like TC-001, TC-002, etc.
- Write concise, imperative steps (e.g., "Click login button", "Enter valid email")
- Include Positive, Negative, and Edge test cases where relevant
- Categories: Positive, Negative, Edge, Authorization, Non-Functional
- Steps should be actionable and specific
- Expected results should be clear and measurable

Return ONLY the JSON object, no additional text or formatting.`

export function buildPrompt(request: GenerateRequest): string {
  const { storyTitle, acceptanceCriteria, description, additionalInfo } = request
  
  let userPrompt = `Generate comprehensive test cases for the following user story:

Story Title: ${storyTitle}

Acceptance Criteria:
${acceptanceCriteria}
`

  if (description) {
    userPrompt += `\nDescription:\n${description}\n`
  }

  if (additionalInfo) {
    userPrompt += `\nAdditional Information:\n${additionalInfo}\n`
  }

  // If category is provided (CSV), instruct the model to generate only those categories
  const rawCategory = (request as any).category
  if (rawCategory && String(rawCategory).trim().length > 0) {
    const cats = String(rawCategory)
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .join(', ')

    userPrompt += `\n\nOnly generate test cases belonging to the following category(ies): ${cats}.\n` +
      `For each test case include a top-level \"category\" field with one of these exact category names.`
  } else {
    // Default to generating across all categories
    userPrompt += `\n\nGenerate test cases across all categories (Positive, Negative, Edge, Authorization, Non-Functional) unless some are not applicable.`
  }

  const requestedCount = (request as any).testcaseCount
  if (typeof requestedCount === 'number' && Number.isInteger(requestedCount)) {
    userPrompt += `\n\nImportant: Generate exactly ${requestedCount} test case(s). DO NOT GENERATE MORE. If you cannot produce exactly ${requestedCount}, return. If you output more than ${requestedCount}, include only the first ${requestedCount} in the "cases" array.`
  } else {
    userPrompt += `\n\nImportant: If not specified, attempt to generate a reasonable number of test cases (aim for 5-10).`
  }

  userPrompt += ` Return only the JSON response.`

  return userPrompt
}
