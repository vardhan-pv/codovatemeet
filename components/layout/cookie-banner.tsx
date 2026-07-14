'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, XCircle, Settings2, ShieldCheck, Cookie } from 'lucide-react'

// Declare gtag globally
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  functional: boolean
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true
    analytics: false,
    functional: false
  })

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('codovate_cookie_consent')
    
    if (!consent) {
      // Small delay to not overwhelm the user immediately
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    } else {
      // Initialize gtag with saved preferences if they already exist
      try {
        const savedPrefs = JSON.parse(consent) as CookiePreferences
        if (savedPrefs.analytics && typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            'analytics_storage': 'granted'
          })
        }
      } catch (e) {
        console.error("Could not parse cookie consent")
      }
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('codovate_cookie_consent', JSON.stringify(prefs))
    
    // Update Google Tag Manager Consent Mode
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'personalization_storage': prefs.functional ? 'granted' : 'denied'
      })
    }
    
    setShowBanner(false)
  }

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      functional: true
    })
  }

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      functional: false
    })
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto shadow-2xl rounded-2xl bg-[#0a0f1c]/95 border border-white/10 backdrop-blur-2xl overflow-hidden flex flex-col">
            
            {/* Main Banner Area */}
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20">
                  <Cookie className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="sm:hidden">🍪</span> We Value Your Privacy
                  </h2>
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
                    Codovate Meet uses cookies to improve your experience, remember your preferences, enhance security, and analyze website traffic. You can choose which cookies to allow.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Button 
                  onClick={handleAcceptAll} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 px-6"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept All
                </Button>
                <Button 
                  onClick={handleRejectNonEssential} 
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-slate-300 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Non-Essential
                </Button>
                <Button 
                  onClick={() => setShowPreferences(!showPreferences)} 
                  variant="ghost"
                  className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 ml-auto"
                >
                  <Settings2 className="w-4 h-4" />
                  {showPreferences ? 'Hide Preferences' : 'Manage Preferences'}
                </Button>
              </div>
            </div>

            {/* Expandable Preferences Area */}
            <AnimatePresence>
              {showPreferences && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/5 bg-black/20"
                >
                  <div className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Essential */}
                      <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            Essential
                          </h3>
                          <Switch checked={true} disabled />
                        </div>
                        <p className="text-xs text-slate-400">Always enabled.</p>
                        <ul className="text-xs text-slate-500 list-disc pl-4 mt-2 space-y-1">
                          <li>Login sessions</li>
                          <li>Security</li>
                          <li>Meeting functionality</li>
                        </ul>
                      </div>

                      {/* Analytics */}
                      <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">Analytics</h3>
                          <Switch 
                            checked={preferences.analytics} 
                            onCheckedChange={(c) => setPreferences({...preferences, analytics: c})}
                          />
                        </div>
                        <p className="text-xs text-slate-400">Helps us improve.</p>
                        <ul className="text-xs text-slate-500 list-disc pl-4 mt-2 space-y-1">
                          <li>Google Analytics</li>
                          <li>Performance metrics</li>
                        </ul>
                      </div>

                      {/* Functional */}
                      <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">Functional</h3>
                          <Switch 
                            checked={preferences.functional} 
                            onCheckedChange={(c) => setPreferences({...preferences, functional: c})}
                          />
                        </div>
                        <p className="text-xs text-slate-400">For a personalized experience.</p>
                        <ul className="text-xs text-slate-500 list-disc pl-4 mt-2 space-y-1">
                          <li>Language</li>
                          <li>Theme (Dark/Light mode)</li>
                          <li>User preferences</li>
                        </ul>
                      </div>

                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSavePreferences} className="bg-white text-black hover:bg-slate-200">
                        Save My Preferences
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
