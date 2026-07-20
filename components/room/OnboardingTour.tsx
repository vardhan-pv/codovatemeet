'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Code, Paintbrush, Wifi, Archive, ChevronRight, X, Check } from 'lucide-react'
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
      description: 'Your AI-powered developer collaboration workspace combining video meetings, live code editing, and intelligent meeting memory.',
      icon: Sparkles,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Collaborative Workspace',
      description: 'Click Code or Whiteboard in the top navigation bar to open a real-time multi-user VS Code editor or interactive canvas with your peers.',
      icon: Code,
      color: 'from-indigo-600 to-purple-600'
    },
    {
      title: 'Adaptive Network Optimization HUD',
      description: 'Monitor latency, bitrate, and packet loss in real time. Low Bandwidth Mode automatically protects voice clarity on weak connections.',
      icon: Wifi,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'Export Everything Package',
      description: 'Nothing created in a meeting is ever lost! Download all code, whiteboard drawings, AI notes, chat, and reports with 1-click.',
      icon: Archive,
      color: 'from-amber-600 to-rose-600'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete()
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
          className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100 space-y-6"
        >
          {/* Top Progress Dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <button onClick={onComplete} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`p-4 rounded-3xl bg-gradient-to-r ${steps[currentStep].color} text-white shadow-xl shadow-blue-500/10`}>
              <StepIcon className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              {steps[currentStep].title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-xs text-slate-400 hover:text-white"
            >
              Skip Tour
            </Button>

            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 h-10 rounded-xl flex items-center gap-1.5"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" /> Got it!
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
