import { useState } from 'react'
import { BarChart2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PollsSidebar() {
  const [polls, setPolls] = useState([
    {
      id: '1',
      question: 'Should we push the release to Thursday?',
      options: [
        { text: 'Yes, need more testing time', votes: 3 },
        { text: 'No, launch as planned', votes: 1 }
      ],
      active: true,
      voted: false
    }
  ])

  const handleVote = (pollId: string, optionIndex: number) => {
    setPolls(polls.map(p => {
      if (p.id !== pollId || p.voted) return p
      const newOptions = [...p.options]
      newOptions[optionIndex].votes += 1
      return { ...p, options: newOptions, voted: true }
    }))
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 animate-in slide-in-from-right-10 text-white">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-purple-400" />
          <h2 className="font-bold text-sm tracking-wide">Live Polls</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)
          
          return (
            <div key={poll.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col shadow-sm">
              <h3 className="text-xs font-bold text-slate-100 mb-3 leading-snug">{poll.question}</h3>
              <div className="space-y-2">
                {poll.options.map((opt, idx) => {
                  const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
                  return (
                    <button
                      key={idx}
                      onClick={() => handleVote(poll.id, idx)}
                      disabled={poll.voted}
                      className="w-full text-left relative overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 p-2 text-[10px] font-semibold hover:border-purple-500/50 transition-all disabled:cursor-default"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex justify-between items-center z-10 px-1">
                        <span className="text-slate-200">{opt.text}</span>
                        {poll.voted && <span className="text-purple-300">{percentage}%</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-3 text-right">
                {totalVotes} Votes
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/80 shrink-0">
        <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8 rounded-lg shadow-lg shadow-purple-900/20">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Poll
        </Button>
      </div>
    </div>
  )
}
