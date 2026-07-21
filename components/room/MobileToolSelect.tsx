"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Users, Sparkles, CheckSquare, BarChart2, Clock, Timer,
  Crown, Footprints, Sliders, Calendar, Flag, Grid, X, ChevronRight, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileToolSelectProps {
  activeSidebar: string | null
  setActiveSidebar: (sidebar: string | null) => void
  setIsOnToGoMode: (val: boolean) => void
  participantsCount: number
  meetingType: string
}

export function MobileToolSelect({
  activeSidebar,
  setActiveSidebar,
  setIsOnToGoMode,
  participantsCount,
  meetingType
}: MobileToolSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (val: string) => {
    if (val === 'onthego') {
      setIsOnToGoMode(true)
    } else {
      setActiveSidebar(activeSidebar === val ? null : val)
    }
    setIsOpen(false)
  }

  const primaryTools = [
    { value: 'chat', label: 'Chat & DMs', icon: MessageSquare, color: 'text-blue-400' },
    { value: 'participants', label: `Participants (${participantsCount})`, icon: Users, color: 'text-indigo-400' },
    { value: 'ai', label: 'AI Notes & Memory', icon: Sparkles, color: 'text-purple-400' },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-emerald-400' },
    { value: 'polls', label: 'Polls', icon: BarChart2, color: 'text-amber-400' },
    { value: 'timetravel', label: 'Timeline', icon: Clock, color: 'text-sky-400' },
    { value: 'focus', label: 'Focus Timer', icon: Timer, color: 'text-rose-400' },
  ]

  if (meetingType === 'technical') {
    primaryTools.push({ value: 'interview', label: 'Interview Mode', icon: Crown, color: 'text-amber-400' })
  }

  const secondaryTools = [
    { value: 'onthego', label: 'On-the-Go Low Data', icon: Footprints, color: 'text-emerald-400' },
    { value: 'effects', label: 'Effects & Audio', icon: Sliders, color: 'text-blue-400' },
    { value: 'scheduler', label: 'Schedule', icon: Calendar, color: 'text-indigo-400' },
    { value: 'abuse', label: 'Report Abuse', icon: Flag, color: 'text-rose-400' },
  ]

  return (
    <div className="md:hidden">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="h-9 text-xs font-bold border-slate-800 bg-slate-900/90 text-white hover:bg-slate-800 rounded-xl shadow-lg px-3 flex items-center gap-2 active:scale-95 transition"
      >
        <Grid className="w-4 h-4 text-indigo-400" />
        <span className="truncate max-w-[100px]">
          {activeSidebar ? activeSidebar.charAt(0).toUpperCase() + activeSidebar.slice(1) : 'Tools'}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[140] flex flex-col justify-end bg-black/80 backdrop-blur-md">
            {/* Backdrop click dismiss */}
            <div className="flex-1" onClick={() => setIsOpen(false)} />

            {/* Mobile Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="bg-slate-950 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col overflow-hidden text-white"
            >
              {/* Drag Handle & Header */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Meeting Tools & Utilities</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Tool Grid */}
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                    Workspace Sidebars
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {primaryTools.map((tool) => {
                      const Icon = tool.icon
                      const isActive = activeSidebar === tool.value
                      return (
                        <button
                          key={tool.value}
                          onClick={() => handleSelect(tool.value)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition active:scale-95 ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30'
                              : 'bg-slate-900/60 border-white/5 text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tool.color}`} />
                          <span className="text-xs font-semibold truncate">{tool.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                    Meeting Utilities
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {secondaryTools.map((tool) => {
                      const Icon = tool.icon
                      return (
                        <button
                          key={tool.value}
                          onClick={() => handleSelect(tool.value)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-200 hover:bg-slate-800 text-left transition active:scale-95"
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${tool.color}`} />
                          <span className="text-xs font-semibold truncate">{tool.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
