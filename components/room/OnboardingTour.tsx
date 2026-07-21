'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Code, Paintbrush, Wifi, Archive, ChevronRight, X, Check,
  Mic, Video, MessageSquare, MonitorUp, ShieldAlert, Brain, Users,
  Pencil, Activity, Radio
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingTourProps {
  isOpen?: boolean
  onComplete: () => void
}

export function OnboardingTour({ isOpen = true, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Welcome to Codovate Meet!',
      description: 'Your AI-powered developer collaboration workspace combining video meetings, live code editing, and intelligent meeting memory. Let\'s take a quick tour of the key features.',
      icon: Sparkles,
      color: 'from-blue-600 to-indigo-600',
      tip: 'You can replay this tour anytime from the "More" menu → Help & Walkthrough.'
    },
    {
      title: 'Audio & Video Controls',
      description: 'Your microphone and camera controls are at the bottom left of the screen. Click the mic icon to mute/unmute, and the camera icon to enable/disable your video. You can also apply visual filters and noise cancellation from the Effects panel.',
      icon: Mic,
      color: 'from-emerald-600 to-teal-600',
      tip: 'Keyboard shortcut: Press M to toggle mic, V to toggle camera.'
    },
    {
      title: 'Screen Sharing & Annotation',
      description: 'Click the screen share button to present your entire screen, a specific window, or a browser tab. While sharing, you can activate the Annotation Tool from the "More" menu to draw, highlight, and add sticky notes directly on the shared screen.',
      icon: MonitorUp,
      color: 'from-sky-600 to-blue-600',
      tip: 'Annotation tools include pen, highlighter, shapes, text, laser pointer, and sticky notes.'
    },
    {
      title: 'Chat & Direct Messaging',
      description: 'The Chat panel on the right side lets you communicate with everyone in the meeting. Switch to the DM tab to send private one-on-one messages to specific participants without others seeing.',
      icon: MessageSquare,
      color: 'from-violet-600 to-purple-600',
      tip: 'The host can disable chat or DMs for privacy/focus during presentations.'
    },
    {
      title: 'Collaborative Code Workspace',
      description: 'Click "Code" in the top navigation bar to open a real-time multi-user VS Code editor. Write, edit, and review code collaboratively with your peers. The AI Pair Programmer can assist with code suggestions and reviews.',
      icon: Code,
      color: 'from-indigo-600 to-purple-600',
      tip: 'You can push code directly to GitHub from the workspace!'
    },
    {
      title: 'Interactive Whiteboard',
      description: 'Click "Whiteboard" in the top navigation bar to open a shared canvas. Draw diagrams, wireframes, and visual plans together in real-time. Perfect for brainstorming sessions and architecture discussions.',
      icon: Paintbrush,
      color: 'from-pink-600 to-rose-600',
      tip: 'The host can lock the whiteboard to prevent editing during presentations.'
    },
    {
      title: 'AI Meeting Assistant',
      description: 'The AI Assistant understands your meeting context — chat history, code, and transcript. Ask it to generate meeting summaries, extract action items, review code, or answer technical questions. Summaries can be automatically emailed to all participants.',
      icon: Brain,
      color: 'from-amber-600 to-orange-600',
      tip: 'Type "@ai" in chat or click the AI button to start a conversation with the assistant.'
    },
    {
      title: 'Adaptive Network Optimization',
      description: 'The network quality indicator in the toolbar shows your connection health in real-time. Low Bandwidth Mode automatically activates on weak connections to protect voice clarity. You can also manually switch to Audio-Only mode.',
      icon: Wifi,
      color: 'from-emerald-600 to-teal-600',
      tip: 'Click the signal icon to view detailed network diagnostics and adjust quality settings.'
    },
    {
      title: 'Meeting Recording & Export',
      description: 'Record your meeting locally using the Record option in the "More" menu. When the meeting ends, export everything — code, whiteboard, chat, AI notes, and recordings — as a single download package.',
      icon: Radio,
      color: 'from-rose-600 to-pink-600',
      tip: 'Recording requires host permission. Ask the host to grant recording access.'
    },
    {
      title: 'Host Admin Controls',
      description: 'Meeting hosts have access to the Admin Command Center via the "More" menu. Control participant permissions, lock features, manage the waiting room, monitor network quality, and moderate the entire meeting.',
      icon: ShieldAlert,
      color: 'from-indigo-600 to-blue-600',
      tip: 'Hosts can assign Co-Hosts to share moderation responsibilities.'
    },
    {
      title: 'You\'re All Set!',
      description: 'You\'re ready to collaborate! Explore the workspace, invite teammates, and use the AI assistant to boost your productivity. If you need help, click the "?" icon in the "More" menu anytime.',
      icon: Check,
      color: 'from-emerald-600 to-green-600',
      tip: 'Pro tip: Use the Export button (📦) to save all meeting artifacts before leaving.'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  if (!isOpen) return null

  const StepIcon = steps[currentStep].icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Progress Bar */}
          <div className="h-1 bg-slate-900">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          <div className="p-6 space-y-5">
            {/* Header with dots and close */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-6 bg-blue-500' : i < currentStep ? 'w-3 bg-blue-500/40' : 'w-1.5 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {currentStep + 1}/{steps.length}
                </span>
                <button onClick={onComplete} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className={`p-4 rounded-3xl bg-gradient-to-r ${steps[currentStep].color} text-white shadow-xl shadow-blue-500/10`}>
                  <StepIcon className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">
                  {steps[currentStep].title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  {steps[currentStep].description}
                </p>

                {/* Tip */}
                {steps[currentStep].tip && (
                  <div className="w-full p-3 bg-slate-900/80 border border-blue-500/20 rounded-xl text-left">
                    <p className="text-[11px] text-blue-300 leading-relaxed">
                      <span className="font-bold text-blue-400 mr-1">💡 Tip:</span>
                      {steps[currentStep].tip}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onComplete}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Skip Tour
                </Button>
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    ← Back
                  </Button>
                )}
              </div>

              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 h-10 rounded-xl flex items-center gap-1.5"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" /> Let's Go!
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
