import React, { useState, useEffect } from 'react'
import { Rocket, Server, Play, CheckCircle, TerminalSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export function DeployPanel() {
  const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  
  const handleDeploy = () => {
    setDeployState('deploying')
    setLogs(['Initializing deployment environment...', 'Fetching repository...', 'Building project...'])
    
    // Simulate deploy logs
    let i = 0
    const mockLogs = [
      'Installing dependencies...',
      'Running build script (npm run build)...',
      'Optimizing production build...',
      'Deploying to Vercel edge network...',
      'Deployment successful!'
    ]
    
    const interval = setInterval(() => {
      if (i < mockLogs.length) {
        setLogs(prev => [...prev, mockLogs[i]])
        i++
      } else {
        clearInterval(interval)
        setDeployState('success')
      }
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full bg-background/50 p-4">
      <div className="mb-6">
        <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-indigo-400" /> One-Click Deploy
        </h3>
        <p className="text-xs text-slate-400">Deploy the current workspace directly to a staging environment for review.</p>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-300">Target Provider</span>
            <span className="text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded">Vercel</span>
          </div>
          
          <Button 
            onClick={handleDeploy}
            disabled={deployState === 'deploying'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {deployState === 'deploying' ? (
              <span className="flex items-center gap-2 animate-pulse"><Server className="w-4 h-4" /> Deploying...</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Deploy Staging</span>
            )}
          </Button>
        </div>

        {deployState !== 'idle' && (
          <div className="flex flex-col flex-1 bg-black/50 border border-slate-800 rounded-lg overflow-hidden min-h-[200px]">
            <div className="bg-slate-900 px-3 py-1.5 flex items-center gap-2 border-b border-slate-800">
              <TerminalSquare className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400">Build Logs</span>
            </div>
            <ScrollArea className="flex-1 p-3 font-mono text-[10px] text-slate-300">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 opacity-90">{`> ${log}`}</div>
              ))}
              {deployState === 'deploying' && (
                <div className="animate-pulse text-indigo-400">{`> _`}</div>
              )}
            </ScrollArea>
          </div>
        )}

        {deployState === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Deployed Successfully</p>
              <a href="#" className="text-[10px] text-emerald-500/70 hover:underline break-all">https://meet-staging-1x2y3z.vercel.app</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
