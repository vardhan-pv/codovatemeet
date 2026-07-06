"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileToolSelect({ activeSidebar, setActiveSidebar, setIsOnToGoMode, participantsCount, meetingType }: any) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (val: string) => {
    if (val === 'onthego') {
      setIsOnToGoMode(true)
    } else {
      setActiveSidebar(val)
    }
    setIsOpen(false)
  }

  const items = [
    { value: 'chat', label: '💬 Chat' },
    { value: 'participants', label: `👥 Participants (${participantsCount})` },
    { value: 'ai', label: '✨ AI Notes' },
    { value: 'tasks', label: '📋 Tasks' },
    { value: 'polls', label: '📊 Polls' },
    { value: 'timetravel', label: '⏰ Timeline' },
    { value: 'focus', label: '⏱️ Focus' },
  ]

  if (meetingType === 'technical') {
    items.push({ value: 'interview', label: '👑 Interview' })
  }

  items.push(
    { divider: true },
    { value: 'onthego', label: '🚶 On-the-go Mode' },
    { value: 'effects', label: '👤 Effects' },
    { value: 'scheduler', label: '📅 Schedule' },
    { value: 'abuse', label: '🚩 Report Abuse' }
  )

  return (
    <div className="relative md:hidden">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs font-bold border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white rounded-lg shadow-md border px-3 flex items-center gap-2"
      >
        <span>⚙️</span> {activeSidebar ? activeSidebar.charAt(0).toUpperCase() + activeSidebar.slice(1) : 'Select Tool'}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 w-56 bg-slate-900 border border-slate-700 text-white shadow-2xl rounded-xl py-1 z-[100] overflow-hidden flex flex-col">
            <div className="px-3 py-1.5 text-[10px] uppercase text-slate-400 font-bold tracking-wider">Sidebar Tools</div>
            
            {items.map((item: any, idx) => {
              if (item.divider) {
                return (
                  <div key={idx} className="my-1">
                    <div className="h-px bg-slate-700/50 w-full" />
                    <div className="px-3 py-1.5 mt-1 text-[10px] uppercase text-slate-400 font-bold tracking-wider">More Utilities</div>
                  </div>
                )
              }
              return (
                <button
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-800 ${item.value === 'abuse' ? 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300' : ''}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
