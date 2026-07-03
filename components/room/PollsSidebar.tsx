import { useState } from 'react'
import { BarChart2, Plus, Trash, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PollOption {
  text: string
  votes: number
  voters: string[]
}

interface Poll {
  id: string
  creator: string
  question: string
  options: PollOption[]
  active: boolean
}

interface PollsSidebarProps {
  room: any
  lobbyName: string
  sendData: (type: string, payload: any) => void
  polls: Poll[]
  setPolls: React.Dispatch<React.SetStateAction<Poll[]>>
}

export function PollsSidebar({ room, lobbyName, sendData, polls, setPolls }: PollsSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, idx) => idx !== index))
  }

  const handleOptionChange = (index: number, val: string) => {
    setOptions(options.map((opt, idx) => (idx === index ? val : opt)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    const filteredOptions = options.map(o => o.trim()).filter(Boolean)
    if (filteredOptions.length < 2) {
      alert('Please enter at least 2 options for the poll.')
      return
    }

    const pollId = 'poll-' + Math.random().toString(36).substring(2, 9)
    const newPoll: Poll = {
      id: pollId,
      creator: lobbyName,
      question: question.trim(),
      options: filteredOptions.map(text => ({ text, votes: 0, voters: [] })),
      active: true
    }

    // Broadcast new poll to other participants
    sendData('NEW_POLL', { poll: newPoll })

    // Add locally
    setPolls(prev => [...prev, newPoll])

    // Reset Form
    setQuestion('')
    setOptions(['', ''])
    setShowCreateForm(false)
  }

  const handleVote = (pollId: string, optionIndex: number) => {
    // Broadcast vote to other participants
    sendData('POLL_VOTE', { pollId, optionIndex, voter: lobbyName })

    // Apply vote locally
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p
      const alreadyVoted = p.options.some(o => o.voters.includes(lobbyName))
      if (alreadyVoted) return p

      return {
        ...p,
        options: p.options.map((opt, idx) => {
          if (idx !== optionIndex) return opt
          return {
            ...opt,
            votes: opt.votes + 1,
            voters: [...opt.voters, lobbyName]
          }
        })
      }
    }))
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 animate-in slide-in-from-right-10 text-white select-none">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-purple-400" />
          <h2 className="font-bold text-sm tracking-wide">Live Polls</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {showCreateForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Create New Poll</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question</label>
              <Input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g., Should we adopt Next.js 16?"
                required
                className="bg-slate-800 border-slate-700/60 focus:border-purple-500 rounded-xl h-10 px-3 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Options</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required={idx < 2}
                    className="bg-slate-800 border-slate-700/60 focus:border-purple-500 rounded-xl h-9 px-3 text-xs flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-9 w-9 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 shrink-0 border border-slate-700/60"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleAddOption}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-8 rounded-lg border border-purple-500/20 px-3"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Option
              </Button>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setQuestion('')
                  setOptions(['', ''])
                }}
                className="flex-1 h-9 rounded-xl text-xs font-bold border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Create
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {polls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart2 className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-300 mb-1">No Active Polls</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                  Gather feedback instantly. Create a poll to ask participants their opinion.
                </p>
              </div>
            ) : (
              polls.map(poll => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)
                const userHasVoted = poll.options.some(opt => opt.voters.includes(lobbyName))

                return (
                  <div key={poll.id} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 leading-snug">{poll.question}</h3>
                    <div className="space-y-2">
                      {poll.options.map((opt, idx) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
                        const optionVotedByMe = opt.voters.includes(lobbyName)

                        return (
                          <button
                            key={idx}
                            onClick={() => handleVote(poll.id, idx)}
                            disabled={userHasVoted}
                            className={`w-full text-left relative overflow-hidden rounded-lg border p-2.5 text-[10px] font-bold transition-all disabled:cursor-default ${
                              optionVotedByMe
                                ? 'border-purple-500/50 bg-purple-500/10'
                                : 'border-slate-700/40 bg-slate-900/40 hover:border-slate-600/60'
                            }`}
                          >
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-purple-500/10 transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative flex justify-between items-center z-10 px-1">
                              <span className="text-slate-200">{opt.text}</span>
                              {userHasVoted && <span className="text-purple-400 font-extrabold">{percentage}%</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-3">
                      <span>Created by {poll.creator === lobbyName ? 'You' : poll.creator}</span>
                      <span>{totalVotes} Votes</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {!showCreateForm && (
        <div className="p-4 border-t border-white/5 bg-slate-900/80 shrink-0">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-purple-900/10"
          >
            <Plus className="h-4 w-4 mr-1" /> New Poll
          </Button>
        </div>
      )}
    </div>
  )
}
