import express from 'express'
import { GroqClient } from '../llm/groqClient'
import { GenerateRequestSchema, GenerateResponseSchema, GenerateResponse } from '../schemas'
import { SYSTEM_PROMPT, buildPrompt } from '../prompt'

export const generateRouter = express.Router()

generateRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = GenerateRequestSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      res.status(400).json({
        error: `Validation error: ${validationResult.error.message}`
      })
      return
    }

    const request = validationResult.data

  // Build prompts
  const userPrompt = buildPrompt(request)

    // Create GroqClient instance here to ensure env vars are loaded
    const groqClient = new GroqClient()

    // Generate tests using Groq
    try {
      const groqResponse = await groqClient.generateTests(SYSTEM_PROMPT, userPrompt)
      
      // Parse the JSON content (allowing optional note)
      let parsedResponse: any
      try {
        parsedResponse = JSON.parse(groqResponse.content)
      } catch (parseError) {
        res.status(502).json({
          error: 'LLM returned invalid JSON format'
        })
        return
      }

      // Validate the response schema
      const responseValidation = GenerateResponseSchema.safeParse(parsedResponse)
      if (!responseValidation.success) {
        res.status(502).json({
          error: 'LLM response does not match expected schema'
        })
        return
      }

      const validated = responseValidation.data

      const requestedCount = (request as any).testcaseCount
      let finalCases = validated.cases
      let finalNote = (validated as any).note

      if (typeof requestedCount === 'number') {
        if (finalCases.length > requestedCount) {
          // Truncate and explain
          finalCases = finalCases.slice(0, requestedCount)
          const truncNote = `LLM returned ${validated.cases.length} cases, truncated to requested ${requestedCount}.`
          finalNote = finalNote ? `${finalNote} ${truncNote}` : truncNote
        } else if (finalCases.length < requestedCount) {
          const shortageNote = `LLM returned only ${finalCases.length} cases while ${requestedCount} were requested.`
          finalNote = finalNote ? `${finalNote} ${shortageNote}` : shortageNote
        }
      }

      // Add token usage info if available and echo requestedCount
      const finalResponse = {
        ...validated,
        cases: finalCases,
        note: finalNote,
        requestedCount: typeof requestedCount === 'number' ? requestedCount : undefined,
        model: groqResponse.model,
        promptTokens: groqResponse.promptTokens,
        completionTokens: groqResponse.completionTokens
      }

      res.json(finalResponse)
    } catch (llmError) {
      console.error('LLM error:', llmError)
      res.status(502).json({
        error: 'Failed to generate tests from LLM service'
      })
      return
    }
  } catch (error) {
    console.error('Error in generate route:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})