'use client'

import { useState, useRef, useCallback } from 'react'

export interface MeetingSummaryData {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  decisions: string[]
  followUps: string[]
  generatedAt: string
  provider: string
}

interface ChatMessage {
  sender?: string
  sender_name?: string
  text?: string
  message?: string
}

interface UseMeetingSummaryOptions {
  backendUrl: string
  roomId: string
  meetingTitle?: string
  token?: string | null
}

export function useMeetingSummary({ backendUrl, roomId, meetingTitle, token }: UseMeetingSummaryOptions) {
  const [summary, setSummary] = useState<MeetingSummaryData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Accumulators for meeting context
  const chatMessagesRef = useRef<ChatMessage[]>([])
  const transcriptRef = useRef<any[]>([])
  const codeSnapshotRef = useRef<string>('')

  const addChatMessage = useCallback((msg: ChatMessage) => {
    chatMessagesRef.current.push(msg)
  }, [])

  const addTranscriptItem = useCallback((item: any) => {
    transcriptRef.current.push(item)
  }, [])

  const updateCodeSnapshot = useCallback((code: string) => {
    codeSnapshotRef.current = code
  }, [])

  const generateSummary = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Call the AI generate-summary endpoint
      const response = await fetch(`${backendUrl}/api/ai/generate-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roomId,
          meetingTitle: meetingTitle || 'Codovate Meeting',
          chatHistory: chatMessagesRef.current,
          transcript: transcriptRef.current,
          codeSnippet: codeSnapshotRef.current
        })
      })

      if (!response.ok) {
        // Fallback: try the regular AI endpoint with a summary prompt
        const fallbackResponse = await fetch(`${backendUrl}/api/ai`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: 'Generate a comprehensive meeting summary with key discussion points, action items, decisions taken, and follow-up tasks. Format each section clearly.',
            roomId,
            chatHistory: chatMessagesRef.current,
            transcript: transcriptRef.current,
            codeSnippet: codeSnapshotRef.current
          })
        })

        if (!fallbackResponse.ok) throw new Error('Failed to generate summary')

        const fallbackData = await fallbackResponse.json()
        const parsedSummary = parseSummaryFromText(fallbackData.text || '')
        parsedSummary.provider = fallbackData.provider || 'AI'
        setSummary(parsedSummary)
        return parsedSummary
      }

      const data = await response.json()

      const summaryData: MeetingSummaryData = {
        summary: data.summary || '',
        keyPoints: data.keyPoints || [],
        actionItems: data.actionItems || [],
        decisions: data.decisions || [],
        followUps: data.followUps || [],
        generatedAt: new Date().toISOString(),
        provider: data.provider || 'AI'
      }

      setSummary(summaryData)
      return summaryData
    } catch (err: any) {
      const errMsg = err.message || 'Failed to generate summary'
      setError(errMsg)

      // Generate a local fallback summary
      const fallback = generateLocalFallback()
      setSummary(fallback)
      return fallback
    } finally {
      setIsGenerating(false)
    }
  }, [backendUrl, roomId, meetingTitle, token])

  const sendSummaryEmail = useCallback(async (recipientEmails: string[]) => {
    if (!summary) return false
    setIsSendingEmail(true)
    setError(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const summaryText = [
        summary.summary,
        '',
        '**Key Discussion Points:**',
        ...summary.keyPoints.map(p => `• ${p}`),
        '',
        '**Decisions:**',
        ...summary.decisions.map(d => `• ${d}`),
        '',
        '**Follow-up Tasks:**',
        ...summary.followUps.map(f => `• ${f}`)
      ].join('\n')

      const response = await fetch(`${backendUrl}/api/ai/send-summary-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipients: recipientEmails,
          meetingTitle: meetingTitle || 'Codovate Meeting',
          roomId,
          summaryText,
          actionItems: summary.actionItems
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      setEmailSent(true)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to send summary email')
      return false
    } finally {
      setIsSendingEmail(false)
    }
  }, [summary, backendUrl, roomId, meetingTitle, token])

  const saveSummary = useCallback(async () => {
    if (!summary) return false

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${backendUrl}/api/meetings/save-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          meetingCode: roomId,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          actionItems: summary.actionItems,
          decisions: summary.decisions,
          followUps: summary.followUps
        })
      })

      return true
    } catch {
      return false
    }
  }, [summary, backendUrl, roomId, token])

  const resetSummary = useCallback(() => {
    setSummary(null)
    setError(null)
    setEmailSent(false)
  }, [])

  return {
    summary,
    isGenerating,
    isSendingEmail,
    error,
    emailSent,
    generateSummary,
    sendSummaryEmail,
    saveSummary,
    resetSummary,
    addChatMessage,
    addTranscriptItem,
    updateCodeSnapshot
  }
}

// Parse unstructured AI text into structured summary
function parseSummaryFromText(text: string): MeetingSummaryData {
  const sections = {
    summary: '',
    keyPoints: [] as string[],
    actionItems: [] as string[],
    decisions: [] as string[],
    followUps: [] as string[],
    generatedAt: new Date().toISOString(),
    provider: 'AI'
  }

  const lines = text.split('\n')
  let currentSection = 'summary'
  const summaryLines: string[] = []

  for (const line of lines) {
    const lower = line.toLowerCase().trim()

    if (lower.includes('key discussion') || lower.includes('key point') || lower.includes('discussion point')) {
      currentSection = 'keyPoints'
      continue
    } else if (lower.includes('action item') || lower.includes('tasks')) {
      currentSection = 'actionItems'
      continue
    } else if (lower.includes('decision')) {
      currentSection = 'decisions'
      continue
    } else if (lower.includes('follow-up') || lower.includes('follow up') || lower.includes('next step')) {
      currentSection = 'followUps'
      continue
    }

    const cleanLine = line.replace(/^[-*•\d.)\]]+\s*/, '').replace(/^\[.\]\s*/, '').trim()
    if (!cleanLine || cleanLine.startsWith('#')) continue

    if (currentSection === 'summary') {
      summaryLines.push(cleanLine)
    } else if (currentSection === 'keyPoints') {
      sections.keyPoints.push(cleanLine)
    } else if (currentSection === 'actionItems') {
      sections.actionItems.push(cleanLine)
    } else if (currentSection === 'decisions') {
      sections.decisions.push(cleanLine)
    } else if (currentSection === 'followUps') {
      sections.followUps.push(cleanLine)
    }
  }

  sections.summary = summaryLines.join(' ').trim() || text.substring(0, 500)
  return sections
}

function generateLocalFallback(): MeetingSummaryData {
  return {
    summary: 'Meeting summary was generated locally. For AI-powered summaries, ensure API keys are configured in the backend .env file.',
    keyPoints: ['Meeting was held with active participants', 'Discussion covered collaborative workspace topics'],
    actionItems: ['Review meeting chat history for missed items', 'Follow up on any open discussion threads'],
    decisions: ['No specific decisions could be extracted without AI analysis'],
    followUps: ['Schedule follow-up meeting if needed', 'Share meeting recording with absent team members'],
    generatedAt: new Date().toISOString(),
    provider: 'LocalFallback'
  }
}
