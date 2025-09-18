import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router()

// Load Jira credentials from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL // e.g. https://your-domain.atlassian.net
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

router.get('/:storyId', async (req, res) => {
const { storyId } = req.params
  // Debug logging for troubleshooting
  console.log('JIRA_BASE_URL:', JIRA_BASE_URL)
  console.log('JIRA_EMAIL:', JIRA_EMAIL)
  console.log('JIRA_API_TOKEN:', JIRA_API_TOKEN ? '[set]' : '[missing]')
  console.log('Requesting Jira story:', storyId)
 
  if (!storyId) {
    return res.status(400).json({ error: 'Missing storyId' })
  }
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return res.status(500).json({ error: 'Jira credentials not configured' })
  }
  try {
    const jiraUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${storyId}`
    const response = await fetch(jiraUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'),
        'Accept': 'application/json'
      }
    })
    console.log('Jira API request:', jiraUrl)
    console.log('Jira API autorization', 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'))
    if (!response.ok) {
      return res.status(response.status).json({ error: `Jira API error: ${response.statusText}` })
    }
    const data: any = await response.json()
    console.log('Jira API response data:', JSON.stringify(data, null, 2))
    // Extract fields (customize as needed)
    const storyTitle: string = data.fields?.summary || ''
    // Robust description extraction for Jira rich text (bullet lists, paragraphs, etc)
    let description = ''
    if (data.fields?.description?.content) {
      description = data.fields.description.content.map((block: any) => {
        if (block.type === 'bulletList' && block.content) {
          // Extract bullet list items
          return block.content.map((item: any) => {
            return item.content?.map((para: any) => {
              return para.content?.map((txt: any) => txt.text).join(' ')
            }).join(' ')
          }).join('\n')
        } else if (block.type === 'paragraph' && block.content) {
          // Extract paragraph text
          return block.content.map((txt: any) => txt.text).join(' ')
        }
        return ''
      }).join('\n')
    }
   // console.log('Jira description field:', description);
    // Acceptance Criteria: update field ID as needed
    const acceptanceCriteria: string = description || '' // Replace with your Jira field ID
    const desc=''
    res.json({ storyTitle, desc, acceptanceCriteria })
    return
  } catch (err) {
    console.error('Jira API error:', err)
    res.status(500).json({ error: 'Failed to fetch from Jira', details: String(err) })
    return
  }
})

export { router as jiraRouter }
