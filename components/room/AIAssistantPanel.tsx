import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Bug, Code, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AIAssistantPanel() {
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiConversations, setAiConversations] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: "Hello! I am your Codovate AI Meeting Assistant. Ask me to summarize discussions, list action items, or review active code snippets!" }
  ])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [aiConversations])

  const handleAiAction = (action: string) => {
    setAiConversations(prev => [...prev, { sender: 'user', text: `Please ${action.toLowerCase()}...` }])
    setAiLoading(true)
    setTimeout(() => {
      setAiConversations(prev => [...prev, { sender: 'ai', text: `I am analyzing the current context to ${action.toLowerCase()}... (Simulated Response)` }])
      setAiLoading(false)
    }, 1500)
  }

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    const msg = aiInput.trim()
    setAiInput('')
    setAiConversations(prev => [...prev, { sender: 'user', text: msg }])
    setAiLoading(true)

    // Simulate AI response
    setTimeout(() => {
      setAiConversations(prev => [...prev, { sender: 'ai', text: "I can help you with that. Let me review the current meeting transcript and workspace context..." }])
      setAiLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="p-3 border-b border-border bg-card/50 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleAiAction("Fix Bug")} className="h-7 text-[10px] bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
          <Bug className="w-3 h-3 mr-1" /> Fix Bug
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleAiAction("Explain Code")} className="h-7 text-[10px] bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
          <Code className="w-3 h-3 mr-1" /> Explain Code
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleAiAction("Generate Tests")} className="h-7 text-[10px] bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Generate Tests
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="flex flex-col gap-3">
          {aiConversations.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${msg.sender === 'user' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>
                {msg.sender === 'ai' && <Sparkles className="h-3 w-3" />}
                {msg.sender === 'user' ? 'You' : 'Codovate AI'}
              </div>
              <div className={`p-2.5 rounded-xl max-w-[90%] text-xs shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-start">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-2 max-w-[90%]">
                <Sparkles className="h-3 w-3 animate-pulse text-fuchsia-400" />
                <span className="text-xs animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleAiSubmit} className="p-3 border-t border-border bg-card/50 flex gap-2">
        <Input 
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Ask AI for help..."
          className="h-9 bg-background/50 border-slate-700 text-xs"
        />
        <Button type="submit" size="icon" disabled={!aiInput.trim() || aiLoading} className="h-9 w-9 bg-purple-600 hover:bg-purple-700 shrink-0">
          <Send className="h-4 w-4 text-white" />
        </Button>
      </form>
    </div>
  )
}
