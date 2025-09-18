// Fetch Jira info by story ID
export async function fetchJiraInfo(storyId: string): Promise<{ storyTitle: string; description: string; acceptanceCriteria: string }> {
  const response = await fetch(`${API_BASE_URL}/jira/${encodeURIComponent(storyId)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch Jira info')
  }
  return response.json()
}
import { GenerateRequest, GenerateResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api'

export async function generateTests(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    // Defensive: ensure testcaseCount (if provided) is an integer between 1 and 20
    if (typeof (request as any).testcaseCount !== 'undefined') {
      const n = Number((request as any).testcaseCount)
      if (!Number.isInteger(n) || n < 1 || n > 20) {
        throw new Error('testcaseCount must be an integer between 1 and 20')
      }
      ;(request as any).testcaseCount = n
    }
    const response = await fetch(`${API_BASE_URL}/generate-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: GenerateResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error generating tests:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}