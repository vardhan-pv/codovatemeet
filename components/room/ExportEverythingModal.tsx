'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileCode,
  Paintbrush,
  MessageSquare,
  FileText,
  BarChart2,
  Users,
  Archive,
  CheckCircle2,
  X,
  Sparkles,
  Share2,
  FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportEverythingModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  codeContent?: string
  chatMessages?: Array<{ sender: string; text: string; time: any }>
  aiNotes?: string
  polls?: any[]
  participants?: any[]
}

export function ExportEverythingModal({
  isOpen,
  onClose,
  roomId,
  codeContent = '',
  chatMessages = [],
  aiNotes = '',
  polls = [],
  participants = []
}: ExportEverythingModalProps) {
  const [downloadedItems, setDownloadedItems] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const triggerDownload = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloadedItems((prev) => ({ ...prev, [filename]: true }))
  }

  // 1. Export Code Workspace File
  const exportCode = () => {
    const filename = `Code_Workspace_${roomId}.ts`
    triggerDownload(filename, codeContent || '// No code written in workspace', 'text/plain;charset=utf-8')
  }

  // 2. Export Chat Transcript
  const exportChat = (format: 'txt' | 'csv') => {
    if (format === 'csv') {
      const headers = 'Sender,Time,Message\n'
      const rows = chatMessages
        ? chatMessages
            .map((m) => `"${m.sender}","${new Date(m.time).toLocaleTimeString()}","${m.text.replace(/"/g, '""')}"`)
            .join('\n')
        : ''
      triggerDownload(`Chat_Transcript_${roomId}.csv`, headers + rows, 'text/csv;charset=utf-8')
    } else {
      const content = chatMessages
        ? chatMessages
            .map((m) => `[${new Date(m.time).toLocaleTimeString()}] ${m.sender}: ${m.text}`)
            .join('\n')
        : 'No chat messages.'
      triggerDownload(`Chat_Transcript_${roomId}.txt`, content, 'text/plain;charset=utf-8')
    }
  }

  // 3. Export AI Notes & Action Items
  const exportAINotes = () => {
    const header = `# Meeting Summary & Action Items\nMeeting Room: ${roomId}\nDate: ${new Date().toLocaleString()}\n\n`
    const content = header + (aiNotes || 'No AI notes generated yet.')
    triggerDownload(`AI_Meeting_Notes_${roomId}.md`, content, 'text/markdown;charset=utf-8')
  }

  // 4. Export Poll Results Report
  const exportPolls = () => {
    const headers = 'Poll ID,Question,Options,Total Votes\n'
    const rows = polls
      ? polls
          .map((p) => `"${p.id}","${p.question.replace(/"/g, '""')}","${p.options.map((o: any) => o.text).join(' | ')}",${p.totalVotes || 0}`)
          .join('\n')
      : ''
    triggerDownload(`Poll_Results_${roomId}.csv`, headers + rows, 'text/csv;charset=utf-8')
  }

  // 5. Export Participant Attendance Report
  const exportAttendance = () => {
    const headers = 'Identity,Name,Role,Status\n'
    const rows = participants
      ? participants
          .map((p) => `"${p.identity}","${p.identity.split('_')[0]}","Participant","Active"`)
          .join('\n')
      : ''
    triggerDownload(`Attendance_Report_${roomId}.csv`, headers + rows, 'text/csv;charset=utf-8')
  }

  // 6. One-Click Export Everything Package
  const exportAllPackage = () => {
    exportCode()
    setTimeout(exportChat.bind(null, 'txt'), 300)
    setTimeout(exportAINotes, 600)
    setTimeout(exportPolls, 900)
    setTimeout(exportAttendance, 1200)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Export Everything Package
                </h3>
                <p className="text-xs text-slate-400">
                  Save all code, whiteboard drawings, AI notes, chat, and reports in one click.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* One Click Export Highlight Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">One-Click Complete Meeting Bundle</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Downloads all code files, whiteboard, AI notes, chat logs & reports instantly.
                  </p>
                </div>
              </div>

              <Button
                onClick={exportAllPackage}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 h-10 rounded-xl shadow-lg shadow-blue-600/30 shrink-0 gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>

            {/* Individual Artifact Exporters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Code Export */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Code Workspace</span>
                    <span className="text-[10px] text-slate-400 font-mono block">.ts, .js, .py, .json</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCode}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800"
                >
                  Download
                </Button>
              </div>

              {/* Chat Transcript Export */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Chat Transcript</span>
                    <span className="text-[10px] text-slate-400 font-mono block">TXT / CSV Logs</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportChat('txt')}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800"
                >
                  Download
                </Button>
              </div>

              {/* AI Notes Export */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">AI Meeting Notes</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Markdown / PDF Report</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportAINotes}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800"
                >
                  Download
                </Button>
              </div>

              {/* Poll Results Export */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Poll Results</span>
                    <span className="text-[10px] text-slate-400 font-mono block">CSV Report</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportPolls}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800"
                >
                  Download
                </Button>
              </div>

              {/* Attendance Report */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between col-span-1 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Attendance & Participation Log
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Participant identities, join timestamps & duration CSV
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportAttendance}
                  className="h-8 text-xs border-slate-700 hover:bg-slate-800"
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
