import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Clock, Plus, Target } from 'lucide-react'

interface AgendaItem {
  id: string
  title: string
  durationMinutes: number
  completed: boolean
}

interface AgendaWorkspaceProps {
  room: any
  lobbyName: string
  sendData: (type: string, payload: any) => void
  agenda: AgendaItem[]
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>
}

export function AgendaWorkspace({ room, lobbyName, sendData, agenda, setAgenda }: AgendaWorkspaceProps) {
  const [newItemTitle, setNewItemTitle] = useState('')

  const handleAdd = () => {
    if (!newItemTitle.trim()) return

    const item: AgendaItem = {
      id: 'agenda-' + Math.random().toString(36).substring(2, 9),
      title: newItemTitle.trim(),
      durationMinutes: 10,
      completed: false
    }

    // Broadcast new agenda topic to other peers
    sendData('NEW_AGENDA_ITEM', { item })

    // Add locally
    setAgenda(prev => [...prev, item])
    setNewItemTitle('')
  }

  const toggleComplete = (id: string) => {
    const item = agenda.find(i => i.id === id)
    if (!item) return
    const newCompleted = !item.completed

    // Broadcast toggle complete status to peers
    sendData('TOGGLE_AGENDA_ITEM', { itemId: id, completed: newCompleted })

    // Apply locally
    setAgenda(prev => prev.map(i => i.id === id ? { ...i, completed: newCompleted } : i))
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] overflow-hidden border border-border animate-in zoom-in-95 select-none">
      <div className="bg-popover px-4 py-3 border-b border-border flex justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" />
          <span className="font-bold text-xs text-white uppercase tracking-wider">Meeting Agenda</span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {agenda.filter(i => i.completed).length} of {agenda.length} completed
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          
          <div className="flex gap-2 mb-8">
            <input 
              type="text"
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Add new agenda topic..."
              className="flex-1 bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-auto px-6 font-bold shadow-lg shadow-emerald-900/20 border-none">
              <Plus className="h-5 w-5 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {agenda.map((item, index) => {
              const isActive = !item.completed && (index === 0 || agenda[index - 1].completed)
              
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    item.completed 
                      ? 'bg-slate-900/50 border-slate-800/80 opacity-50' 
                      : isActive 
                        ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleComplete(item.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        item.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800'
                      }`}
                    >
                      {item.completed && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <h3 className={`font-semibold text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.title}
                      </h3>
                      {isActive && (
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Current Topic
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${item.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    {item.durationMinutes}m
                  </div>
                </div>
              )
            })}
            
            {agenda.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">
                No agenda topics added yet. Add one to keep the meeting on track!
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
