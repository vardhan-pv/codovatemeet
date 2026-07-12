import React from 'react'

interface PreviewPanelProps {
  previewContent: string
  onClose: () => void
}

export function PreviewPanel({
  previewContent,
  onClose
}: PreviewPanelProps) {
  return (
    <div className="w-full md:w-1/2 h-80 md:h-full bg-white border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 relative shadow-2xl">
      {/* Header */}
      <div className="h-9 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 select-none text-[10px] font-mono text-slate-400 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="font-extrabold text-white uppercase tracking-widest text-[9px]">Live Preview</span>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer font-bold text-sm flex items-center justify-center p-0.5 rounded"
          title="Close Preview"
        >
          ×
        </button>
      </div>
      
      {/* Sandbox Iframe */}
      <iframe 
        srcDoc={previewContent} 
        className="flex-1 w-full border-none bg-white"
        sandbox="allow-scripts"
        title="Codovate Live Sandbox"
      />
    </div>
  )
}
