import { useState } from 'react'
import { CheckSquare, Plus, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskItem {
  id: string
  text: string
  assignee: string
  due: string
  completed: boolean
}

interface TasksSidebarProps {
  room: any
  lobbyName: string
  sendData: (type: string, payload: any) => void
  tasks: TaskItem[]
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>
}

export function TasksSidebar({ room, lobbyName, sendData, tasks, setTasks }: TasksSidebarProps) {
  const [newTask, setNewTask] = useState('')

  const handleAddTask = () => {
    if (!newTask.trim()) return

    const task: TaskItem = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      text: newTask.trim(),
      assignee: lobbyName,
      due: 'Today',
      completed: false
    }

    // Broadcast new task to peer participants
    sendData('NEW_TASK', { task })

    // Add locally
    setTasks(prev => [...prev, task])
    setNewTask('')
  }

  const handleToggleComplete = (taskId: string, currentCompleted: boolean) => {
    // Broadcast check toggle to other peers
    sendData('TOGGLE_TASK', { taskId, completed: !currentCompleted })

    // Update locally
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t))
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 animate-in slide-in-from-right-10 text-white select-none">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-400" />
          <h2 className="font-bold text-sm tracking-wide">Action Items</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-300 mb-1">No Action Items</h4>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
              Track meeting deliverables. Create a task below to align your team.
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`border rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-all ${
              task.completed 
                ? 'bg-slate-900/40 border-slate-800/80 opacity-50' 
                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
            }`}>
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id, task.completed)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer" 
                />
                <p className={`text-xs font-medium leading-tight flex-1 ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {task.text}
                </p>
              </div>
              <div className="flex items-center gap-3 pl-6.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {task.assignee}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {task.due}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/80 shrink-0">
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="New action item..."
            className="bg-slate-950 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
          <Button onClick={handleAddTask} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-emerald-900/10 border-none">
            <Plus className="h-4 w-4 mr-1" /> Create Task
          </Button>
        </div>
      </div>
    </div>
  )
}
