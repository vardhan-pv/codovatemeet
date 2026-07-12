import React, { useState } from 'react'
import { X, PlayCircle, Info } from 'lucide-react'
import { Terminal } from '../Terminal'
import type { Terminal as XTerm } from 'xterm'

interface TerminalPanelProps {
  onTerminalReady: (term: XTerm | null) => void
  onClose: () => void
}

type TabType = 'problems' | 'output' | 'debug' | 'terminal' | 'ports'

export function TerminalPanel({
  onTerminalReady,
  onClose
}: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('terminal')

  const tabItems: { id: TabType; label: string; count?: number }[] = [
    { id: 'problems', label: 'Problems', count: 0 },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'ports', label: 'Ports' }
  ]

  return (
    <div className="h-64 border-t border-white/10 bg-[#050816] flex flex-col shrink-0 relative animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
      {/* VS Code Style Bottom Panel Header (Image 2) */}
      <div className="h-9 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/80 select-none shrink-0 font-sans text-xs">
        <div className="flex gap-4 items-center h-full">
          {tabItems.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-1 h-full flex items-center transition-all cursor-pointer ${
                  isActive 
                    ? 'text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-800 rounded-full font-bold text-slate-400">
                      {tab.count}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
        </div>
        
        <button 
          onClick={onClose} 
          className="text-slate-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-0.5 rounded flex items-center justify-center"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Tab Contents */}
      <div className="flex-grow relative min-h-0">
        
        {/* Terminal/Output Tab */}
        <div className={`w-full h-full ${(activeTab === 'terminal' || activeTab === 'output') ? 'block' : 'hidden'}`}>
          <Terminal onTerminalReady={onTerminalReady} />
        </div>

        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-sans text-xs gap-2">
            <Info className="w-6 h-6 text-slate-600" />
            <p>No problems have been detected in the workspace.</p>
          </div>
        )}

        {/* Debug Console Tab */}
        {activeTab === 'debug' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-sans text-xs gap-2">
            <PlayCircle className="w-6 h-6 text-slate-600" />
            <p>Debug Console. Run your code to start debugging.</p>
          </div>
        )}

        {/* Ports Tab */}
        {activeTab === 'ports' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-sans text-xs gap-2">
            <p className="font-semibold text-slate-400">Active Ports</p>
            <p className="text-[10px] text-slate-600">No active forwarded ports. Forward a port in your configurations to sync.</p>
          </div>
        )}

      </div>
    </div>
  )
}
