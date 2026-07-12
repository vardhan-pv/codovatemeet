import React from 'react'
import { Button } from '@/components/ui/button'
import { Play, TerminalSquare } from 'lucide-react'

interface EditorHeaderProps {
  showExplorer: boolean
  setShowExplorer: (val: boolean) => void
  showPreview: boolean
  setShowPreview: (val: boolean) => void
  showTerminal: boolean
  setShowTerminal: (val: boolean) => void
  activeLanguage: string
  onLanguageChange: (lang: string) => void
  autoSaveStatus: 'saved' | 'saving'
  isExecuting: boolean
  onRunCode: () => void
  onGitHubSync: () => void
}

export function EditorHeader({
  showExplorer,
  setShowExplorer,
  showPreview,
  setShowPreview,
  showTerminal,
  setShowTerminal,
  activeLanguage,
  onLanguageChange,
  autoSaveStatus,
  isExecuting,
  onRunCode,
  onGitHubSync
}: EditorHeaderProps) {
  return (
    <div className="h-12 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 shrink-0 shadow-lg select-none">
      <div className="flex items-center gap-3">
        {/* Fake window controls */}
        <div className="hidden sm:flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer" />
        </div>
        
        {/* Toggle Explorer Button */}
        <Button 
          size="sm" 
          variant="ghost" 
          className={`h-8 text-xs rounded-lg ml-1 sm:ml-4 px-3 border border-white/5 transition-all ${
            showExplorer 
              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
              : 'text-slate-450 hover:text-white hover:bg-white/5'
          }`} 
          onClick={() => setShowExplorer(!showExplorer)}
        >
          <span className="hidden sm:inline">📂 Activity Bar</span>
          <span className="sm:hidden">📂</span>
        </Button>

        {/* Language selector */}
        <div className="relative group ml-1 sm:ml-2">
          <select 
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer outline-none transition-all hover:bg-slate-800"
            value={activeLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>

        {/* Auto Save Status Indicator */}
        <div 
          className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold select-none ml-1 sm:ml-4 cursor-default transition-all" 
          title={autoSaveStatus === 'saved' ? 'Synced & Saved to cloud' : 'Saving...'}
        >
          <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            autoSaveStatus === 'saved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-ping'
          }`} />
          <span className={`hidden sm:inline transition-colors duration-300 ${
            autoSaveStatus === 'saved' ? 'text-slate-400' : 'text-amber-500 font-bold'
          }`}>
            {autoSaveStatus === 'saved' ? 'Synced & Saved' : 'Saving...'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Live Preview */}
        <Button 
          size="sm" 
          variant="ghost" 
          className={`h-8 text-xs rounded-lg px-3 border border-white/5 transition-all ${
            showPreview 
              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`} 
          onClick={() => setShowPreview(!showPreview)}
        >
          <span className="hidden sm:inline">👁️ Preview</span>
          <span className="sm:hidden">👁️</span>
        </Button>

        {/* Pull from GitHub */}
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 text-xs text-slate-450 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg hidden sm:flex items-center transition-all" 
          onClick={onGitHubSync}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </Button>

        {/* Toggle Terminal Output */}
        <Button 
          size="sm" 
          variant="ghost" 
          className={`h-8 text-xs rounded-lg px-3 border border-white/5 transition-all ${
            showTerminal 
              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`} 
          onClick={() => setShowTerminal(!showTerminal)}
        >
          <TerminalSquare className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Terminal</span>
        </Button>

        {/* Run Code Button */}
        <Button 
          size="sm" 
          onClick={onRunCode}
          disabled={isExecuting}
          className={`h-8 text-xs rounded-lg font-bold px-3 border transition-all ${
            isExecuting 
              ? 'bg-amber-550/10 text-amber-400 border-amber-500/25 cursor-wait' 
              : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30'
          }`}
        >
          <Play className={`w-3.5 h-3.5 sm:mr-1.5 ${isExecuting ? 'animate-spin' : ''}`} fill="currentColor" />
          <span className="hidden sm:inline">{isExecuting ? 'Running...' : 'Run Code'}</span>
        </Button>
      </div>
    </div>
  )
}
