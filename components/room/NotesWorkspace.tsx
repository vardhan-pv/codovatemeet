import { useState } from 'react'
import { FileText, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotesWorkspace() {
  const [notes, setNotes] = useState('# Meeting Notes\n\n- ')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(notes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] overflow-hidden border border-border animate-in zoom-in-95">
      <div className="bg-popover px-4 py-2 border-b border-border flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-xs text-white uppercase tracking-wider">Shared Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCopy} size="sm" variant="ghost" className="h-7 text-[10px] text-slate-400 hover:text-white font-bold">
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied' : 'Copy Text'}
          </Button>
          <Button onClick={handleDownload} size="sm" variant="ghost" className="h-7 text-[10px] text-slate-400 hover:text-white font-bold">
            <Download className="h-3 w-3 mr-1" /> Export .md
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex min-h-0 bg-slate-950/50">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 w-full h-full p-6 bg-transparent font-mono text-sm text-slate-200 border-none outline-none resize-none focus:ring-0 leading-relaxed placeholder:text-slate-700"
          placeholder="Start typing meeting minutes here..."
        />
      </div>
    </div>
  )
}
