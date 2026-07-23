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
  const isExplorerActive = sidebarTab === 'explorer' && showExplorer
  const isSearchActive = sidebarTab === 'search' && showExplorer
  const isCommentsActive = sidebarTab === 'comments' && showExplorer

  return (
    <div className="w-12 bg-[#141416] flex flex-col items-center py-3 gap-2 border-r border-white/5 select-none shrink-0 h-full">
      {/* Explorer Tab */}
      <div className="relative w-full flex justify-center py-1">
        {isExplorerActive && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r" />
        )}
        <button 
          onClick={() => {
            if (sidebarTab === 'explorer' && showExplorer) {
              if (onToggleExplorer) onToggleExplorer()
            } else {
              setSidebarTab('explorer')
              if (!showExplorer && onToggleExplorer) {
                onToggleExplorer()
              }
            }
          }}
          className={`p-2 rounded-lg transition-all ${
            isExplorerActive 
              ? 'text-primary bg-primary/10' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title="Explorer"
        >
          <FileCode className="w-5 h-5" />
        </button>
      </div>
      
      {/* Search Tab */}
      <div className="relative w-full flex justify-center py-1">
        {isSearchActive && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r" />
        )}
        <button 
          onClick={() => {
            if (sidebarTab === 'search' && showExplorer) {
              if (onToggleExplorer) onToggleExplorer()
            } else {
              setSidebarTab('search')
              if (!showExplorer && onToggleExplorer) {
                onToggleExplorer()
              }
            }
          }}
          className={`p-2 rounded-lg transition-all ${
            isSearchActive 
              ? 'text-primary bg-primary/10' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title="Search & Replace"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      
      {/* Comments Tab */}
      <div className="relative w-full flex justify-center py-1">
        {isCommentsActive && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r" />
        )}
        <button 
          onClick={() => {
            if (sidebarTab === 'comments' && showExplorer) {
              if (onToggleExplorer) onToggleExplorer()
            } else {
              setSidebarTab('comments')
              if (!showExplorer && onToggleExplorer) {
                onToggleExplorer()
              }
            }
          }}
          className={`p-2 rounded-lg transition-all ${
            isCommentsActive 
              ? 'text-primary bg-primary/10' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title="Code Review Comments"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1" />

      {/* AI Assistant Button */}
      <div className="relative w-full flex justify-center py-1 mt-auto">
        <button 
          onClick={onToggleAiSidebar}
          className="p-2 rounded-lg transition-all text-[#a78bfa] hover:text-[#c084fc] hover:bg-[#a78bfa]/10 group relative animate-pulse"
          title="Codovate AI Assistant"
        >
          <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  )
}
