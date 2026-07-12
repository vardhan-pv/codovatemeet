import React from 'react'
import { FileCode, Search, MessageSquare, Sparkles } from 'lucide-react'

interface ActivityBarProps {
  sidebarTab: 'explorer' | 'search' | 'comments'
  setSidebarTab: (tab: 'explorer' | 'search' | 'comments') => void
  onToggleAiSidebar: () => void
}

export function ActivityBar({
  sidebarTab,
  setSidebarTab,
  onToggleAiSidebar
}: ActivityBarProps) {
  return (
    <div className="w-12 bg-[#141416] flex flex-col items-center py-3 gap-4 border-r border-white/5 select-none shrink-0 h-full">
      <button 
        onClick={() => setSidebarTab('explorer')}
        className={`p-2 rounded-lg transition-all relative ${
          sidebarTab === 'explorer' 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title="File Explorer"
      >
        <FileCode className="w-5 h-5" />
        {sidebarTab === 'explorer' && (
          <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r" />
        )}
      </button>
      
      <button 
        onClick={() => setSidebarTab('search')}
        className={`p-2 rounded-lg transition-all relative ${
          sidebarTab === 'search' 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title="Search & Replace"
      >
        <Search className="w-5 h-5" />
        {sidebarTab === 'search' && (
          <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r" />
        )}
      </button>
      
      <button 
        onClick={() => setSidebarTab('comments')}
        className={`p-2 rounded-lg transition-all relative ${
          sidebarTab === 'comments' 
            ? 'text-primary bg-primary/10' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
        title="Code Review Comments"
      >
        <MessageSquare className="w-5 h-5" />
        {sidebarTab === 'comments' && (
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
