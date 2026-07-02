import React, { useState } from 'react'
import { GitBranch, GitPullRequest, GitCommit, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function GitHubPanel() {
  const [isConnected, setIsConnected] = useState(false)
  const [repoSearch, setRepoSearch] = useState('')

  const mockCommits = [
    { id: 'a1b2c3d', msg: 'fix: resolving race condition in deploy hook', author: 'vardhanreddy', time: '10m ago' },
    { id: 'f4e5d6c', msg: 'feat: add github panel to room shell', author: 'vardhanreddy', time: '1h ago' },
    { id: '9a8b7c6', msg: 'chore: update lockfile', author: 'bot', time: '2h ago' }
  ]

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-background/50 p-4 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
          <GitBranch className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-200 mb-2">Connect Repository</h3>
        <p className="text-xs text-slate-400 mb-6">Link a GitHub repository to map discussion to code changes and pull branches.</p>
        <Button 
          onClick={() => setIsConnected(true)}
          className="w-full bg-[#2ea043] hover:bg-[#2c974b] text-white font-bold"
        >
          <GitBranch className="w-4 h-4 mr-2" /> Authenticate with GitHub
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="p-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-semibold text-slate-200">codovate/codovate-meet</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsConnected(false)}>
            Disconnect
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            value={repoSearch}
            onChange={(e) => setRepoSearch(e.target.value)}
            placeholder="Search branches or PRs..." 
            className="h-8 pl-8 text-xs bg-background/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
              <GitPullRequest className="w-3.5 h-3.5" /> Open Pull Requests
            </h4>
            <div className="space-y-2">
              <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-blue-400">#42 Implement AI Copilot</span>
                  <span className="text-[10px] text-slate-500">2d ago</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">Ready for review</p>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-2 h-8 text-xs border-dashed border-slate-600 text-slate-400 hover:text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create PR Summary
            </Button>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
              <GitCommit className="w-3.5 h-3.5" /> Recent Commits
            </h4>
            <div className="space-y-2 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              {mockCommits.map((commit, i) => (
                <div key={commit.id} className="relative flex items-start gap-3 z-10 pl-1">
                  <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 border-primary bg-background shadow-sm" />
                  <div className="flex-1 bg-slate-800/20 rounded p-2 border border-slate-700/30">
                    <p className="text-xs font-mono text-emerald-400 mb-1">{commit.id}</p>
                    <p className="text-[11px] text-slate-300 font-medium leading-tight">{commit.msg}</p>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] text-slate-500">{commit.author}</span>
                      <span className="text-[10px] text-slate-500">{commit.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
