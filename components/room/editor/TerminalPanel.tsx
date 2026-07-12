import React from 'react'
import { TerminalSquare, X } from 'lucide-react'
import { Terminal } from '../Terminal'
import type { Terminal as XTerm } from 'xterm'

interface TerminalPanelProps {
  onTerminalReady: (term: XTerm | null) => void
  onClose: () => void
}

export function TerminalPanel({
  onTerminalReady,
  onClose
}: TerminalPanelProps) {
  return (
    <div className="h-64 border-t border-white/10 bg-[#050816] flex flex-col shrink-0 relative animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
      {/* Header */}
      <div className="h-8 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/80 select-none">
        <div className="flex gap-4">
          <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-1.5">
            <TerminalSquare className="w-3.5 h-3.5 text-primary" /> Console Output
          </span>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-0.5 rounded flex items-center justify-center"
          title="Hide Terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Terminal mount area */}
      <div className="flex-1 relative min-h-0">
        <Terminal onTerminalReady={onTerminalReady} />
      </div>
    </div>
  )
}
