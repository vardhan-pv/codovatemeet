'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Brain, Sparkles, CheckCircle2, Circle, ListChecks, Lightbulb,
  ArrowRight, Mail, Copy, Check, Download, Loader2, AlertTriangle,
  FileText, Target, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MeetingSummaryData } from '@/hooks/useMeetingSummary'

interface MeetingSummaryPanelProps {
  isOpen: boolean
  onClose: () => void
  summary: MeetingSummaryData | null
  isGenerating: boolean
  isSendingEmail: boolean
  emailSent: boolean
  error: string | null
  onGenerate: () => void
  onSendEmail: (emails: string[]) => void
  onSave: () => void
  participantEmails?: string[]
  roomId: string
  meetingTitle?: string
}

export function MeetingSummaryPanel({
  isOpen,
  onClose,
  summary,
  isGenerating,
  isSendingEmail,
  emailSent,
  error,
  onGenerate,
  onSendEmail,
  onSave,
  participantEmails = [],
  roomId,
  meetingTitle
}: MeetingSummaryPanelProps) {
  const [emailInput, setEmailInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedToHistory, setSavedToHistory] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    if (!summary) return
    const text = formatSummaryAsText(summary, roomId, meetingTitle)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!summary) return
    const text = formatSummaryAsText(summary, roomId, meetingTitle)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Meeting_Summary_${roomId}_${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSendEmail = () => {
    const emails = emailInput
      ? emailInput.split(',').map(e => e.trim()).filter(Boolean)
      : participantEmails
    if (emails.length > 0) {
      onSendEmail(emails)
    }
  }

  const handleSave = async () => {
    await onSave()
    setSavedToHistory(true)
    setTimeout(() => setSavedToHistory(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/50 to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Meeting Summary</h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {meetingTitle || 'Meeting'} • {roomId}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Generate Button (if no summary yet) */}
          {!summary && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
                <Sparkles className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Generate Meeting Summary</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Our AI will analyze the chat history, captions, and code workspace to create a comprehensive summary with action items, key decisions, and follow-up tasks.
              </p>
              <Button
                onClick={onGenerate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 h-11 rounded-xl gap-2"
              >
                <Brain className="w-4 h-4" />
                Generate AI Summary
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Brain className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-semibold text-white">Analyzing Meeting Context...</p>
              <p className="text-xs text-slate-400">Processing chat, transcript, and code workspace data</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-300">Summary Generation Notice</p>
                <p className="text-[11px] text-rose-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Summary Content */}
          {summary && (
            <>
              {/* Summary Section */}
              <SummarySection
                icon={FileText}
                title="Meeting Summary"
                color="text-blue-400"
                borderColor="border-blue-500/30"
                bgColor="bg-blue-950/20"
              >
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
              </SummarySection>

              {/* Key Discussion Points */}
              {summary.keyPoints.length > 0 && (
                <SummarySection
                  icon={MessageSquare}
                  title="Key Discussion Points"
                  color="text-purple-400"
                  borderColor="border-purple-500/30"
                  bgColor="bg-purple-950/20"
                >
                  <ul className="space-y-2">
                    {summary.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Lightbulb className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </SummarySection>
              )}

              {/* Action Items */}
              {summary.actionItems.length > 0 && (
                <SummarySection
                  icon={ListChecks}
                  title="Action Items"
                  color="text-emerald-400"
                  borderColor="border-emerald-500/30"
                  bgColor="bg-emerald-950/20"
                >
                  <ul className="space-y-2">
                    {summary.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Circle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </SummarySection>
              )}

              {/* Decisions */}
              {summary.decisions.length > 0 && (
                <SummarySection
                  icon={Target}
                  title="Decisions Taken"
                  color="text-amber-400"
                  borderColor="border-amber-500/30"
                  bgColor="bg-amber-950/20"
                >
                  <ul className="space-y-2">
                    {summary.decisions.map((dec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </SummarySection>
              )}

              {/* Follow-ups */}
              {summary.followUps.length > 0 && (
                <SummarySection
                  icon={ArrowRight}
                  title="Follow-up Tasks"
                  color="text-sky-400"
                  borderColor="border-sky-500/30"
                  bgColor="bg-sky-950/20"
                >
                  <ul className="space-y-2">
                    {summary.followUps.map((fu, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{fu}</span>
                      </li>
                    ))}
                  </ul>
                </SummarySection>
              )}

              {/* Provider & Timestamp */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-white/5">
                <span>Provider: {summary.provider}</span>
                <span>{new Date(summary.generatedAt).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {summary && (
          <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 space-y-3">
            {/* Email Section */}
            <div className="flex items-center gap-2">
              <Input
                placeholder={participantEmails.length > 0 ? `Default: ${participantEmails.length} participant(s)` : 'Enter emails (comma separated)...'}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-slate-900 border-white/10 text-xs text-white flex-1"
              />
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || emailSent}
                className={`h-9 px-4 text-xs font-bold gap-1.5 rounded-xl ${
                  emailSent ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isSendingEmail ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                ) : emailSent ? (
                  <><Check className="w-3.5 h-3.5" /> Sent!</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Email Summary</>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5 border-slate-700 bg-slate-800 text-slate-200 rounded-xl">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs gap-1.5 border-slate-700 bg-slate-800 text-slate-200 rounded-xl">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} className="text-xs gap-1.5 border-slate-700 bg-slate-800 text-slate-200 rounded-xl">
                {savedToHistory ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                {savedToHistory ? 'Saved!' : 'Save to History'}
              </Button>
              <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating} className="text-xs gap-1.5 border-indigo-700 bg-indigo-950/50 text-indigo-300 rounded-xl ml-auto">
                <Brain className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Helper sub-component for summary sections
function SummarySection({
  icon: Icon,
  title,
  color,
  borderColor,
  bgColor,
  children
}: {
  icon: any
  title: string
  color: string
  borderColor: string
  bgColor: string
  children: React.ReactNode
}) {
  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function formatSummaryAsText(summary: MeetingSummaryData, roomId: string, meetingTitle?: string): string {
  const lines = [
    `=== CODOVATE MEET — AI MEETING SUMMARY ===`,
    `Meeting: ${meetingTitle || 'Meeting'}`,
    `Room: ${roomId}`,
    `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
    `Provider: ${summary.provider}`,
    '',
    '--- SUMMARY ---',
    summary.summary,
    ''
  ]

  if (summary.keyPoints.length > 0) {
    lines.push('--- KEY DISCUSSION POINTS ---')
    summary.keyPoints.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
    lines.push('')
  }

  if (summary.actionItems.length > 0) {
    lines.push('--- ACTION ITEMS ---')
    summary.actionItems.forEach((item, i) => lines.push(`[ ] ${i + 1}. ${item}`))
    lines.push('')
  }

  if (summary.decisions.length > 0) {
    lines.push('--- DECISIONS ---')
    summary.decisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`))
    lines.push('')
  }

  if (summary.followUps.length > 0) {
    lines.push('--- FOLLOW-UP TASKS ---')
    summary.followUps.forEach((f, i) => lines.push(`→ ${i + 1}. ${f}`))
    lines.push('')
  }

  lines.push('=== END OF SUMMARY ===')
  return lines.join('\n')
}
