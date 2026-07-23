import React from 'react'
import { FileCode, Search, MessageSquare, Sparkles } from 'lucide-react'

interface ActivityBarProps {
  sidebarTab: 'explorer' | 'search' | 'comments'
  setSidebarTab: (tab: 'explorer' | 'search' | 'comments') => void
  showExplorer?: boolean
  onToggleExplorer?: () => void
  onToggleAiSidebar: () => void
}

export function ActivityBar({
  sidebarTab,
  setSidebarTab,
  showExplorer = true,
  onToggleExplorer,
  onToggleAiSidebar
}: ActivityBarProps) {
  return (
    <div className="w-12 bg-[#141416] flex flex-col items-center py-3 gap-4 border-r border-white/5 select-none shrink-0 h-full">
      <button 
        onClick={() => {
          if (sidebarTab === 'explorer' && showExplorer && onToggleExplorer) {
            onToggleExplorer()
          } else {
            setSidebarTab('explorer')
            if (!showExplorer && onToggleExplorer) {
              onToggleExplorer()
            }
          }
        }}
        className={`p-2 rounded-lg transition-all relative ${
          sidebarTab === 'explorer' && showExplorer 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title={showExplorer && sidebarTab === 'explorer' ? "Close File Explorer" : "File Explorer"}
      >
        <FileCode className="w-5 h-5" />
        {sidebarTab === 'explorer' && showExplorer && (
          <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r" />
        )}
      </button>
      
      <button 
        onClick={() => {
          setSidebarTab('search')
          if (!showExplorer) onToggleExplorer?.()
        }}
        className={`p-2 rounded-lg transition-all relative ${
          showExplorer && sidebarTab === 'search' 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title="Search & Replace"
      >
        <Search className="w-5 h-5" />
        {showExplorer && sidebarTab === 'search' && (
          <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r" />
        )}
      </button>
      
      <button 
        onClick={() => {
          setSidebarTab('comments')
          if (!showExplorer) onToggleExplorer?.()
        }}
        className={`p-2 rounded-lg transition-all relative ${
          showExplorer && sidebarTab === 'comments' 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title="Code Review Comments"
      >
        <MessageSquare className="w-5 h-5" />
        {showExplorer && sidebarTab === 'comments' && (
          <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r" />
        )}
      </button>

      <div className="flex-1" />

      {/* AI Assistant Button */}
      <button 
        onClick={onToggleAiSidebar}
        className="p-2 rounded-lg transition-all text-[#a78bfa] hover:text-[#c084fc] hover:bg-[#a78bfa]/10 group relative animate-pulse mt-auto"
        title="Codovate AI Assistant"
      >
        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
}
