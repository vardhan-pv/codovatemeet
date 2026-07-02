import { useState } from 'react'
import { CheckSquare, Plus, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TasksSidebar() {
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Finalize API documentation', assignee: 'Alex', due: 'Today' },
    { id: '2', text: 'Review UI mockups', assignee: 'Sarah', due: 'Tomorrow' }
  ])
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, assignee: 'Unassigned', due: 'Next Week' }])
    setNewTask('')
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 animate-in slide-in-from-right-10 text-white">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-400" />
          <h2 className="font-bold text-sm tracking-wide">Action Items</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-all hover:bg-slate-800">
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500" />
              <p className="text-xs text-slate-200 font-medium leading-tight">{task.text}</p>
            </div>
            <div className="flex items-center gap-3 pl-5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                <User className="h-3 w-3" /> {task.assignee}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                <Calendar className="h-3 w-3" /> {task.due}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/80 shrink-0">
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="New action item..."
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <Button onClick={addTask} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-lg shadow-lg shadow-emerald-900/20">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Task
          </Button>
        </div>
      </div>
    </div>
  )
}
