'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth'
import { useTheme } from '@/components/theme-provider'
import { ArrowLeft, User, Shield, Check } from 'lucide-react'

interface LogEntry {
  event_type: string
  details: string
  created_at: string
  ip_address?: string
}

export default function SettingsPage() {
  const { user, loadProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  // Form states
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [language, setLanguage] = useState('en')
  
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      await loadProfile()
    }
    init()
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setUsername((user as any).username || '')
      setBio((user as any).bio || '')
      setTimezone((user as any).timezone || 'UTC')
      setLanguage((user as any).language || 'en')
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'security') {
      const fetchLogs = async () => {
        try {
          const fetchedLogs = await authService.getSecurityLogs()
          if (Array.isArray(fetchedLogs)) {
            setLogs(fetchedLogs)
          }
        } catch (e) {}
      }
      fetchLogs()
    }
  }, [activeTab])

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    setErrorMsg(null)
    try {
      await authService.updateProfile({
        name,
        username,
        bio,
        timezone,
        language
      })
      await loadProfile()
      setMessage('Profile settings saved successfully!')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save settings.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-12 transition-colors duration-200">
      {/* Settings Header */}
      <header className="border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-full transition text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-black tracking-tight">Account Settings</h1>
          </div>

        </div>
      </header>

      {/* Main Settings Frame */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tab Navigation */}
          <div className="md:col-span-1 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition border-none cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition border-none cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              <span>Security & Logs</span>
            </button>
          </div>

          {/* Settings Panels */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl"
                >
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Personal Information</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure your default username, timezone, and local languages.</p>
                  </div>

                  {message && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
                      <Check className="h-4 w-4" /> {message}
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl font-bold animate-in fade-in">
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmitProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">Full Name</label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-input border-border h-11 text-sm rounded-xl focus:border-primary text-foreground"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">Username</label>
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. johndoe"
                          className="bg-input border-border h-11 text-sm rounded-xl focus:border-primary text-foreground"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground block">Biography</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full bg-input border border-border p-3 text-sm rounded-xl focus:border-primary focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">Time Zone</label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full h-11 bg-input border border-border px-3 text-sm rounded-xl focus:border-primary focus:outline-none text-foreground"
                          disabled={isLoading}
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground block">Language</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full h-11 bg-input border border-border px-3 text-sm rounded-xl focus:border-primary focus:outline-none text-foreground"
                          disabled={isLoading}
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="hi">हिन्दी (Hindi)</option>
                          <option value="kn">ಕನ್ನಡ (Kannada)</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary hover:bg-[#004fe6] text-white font-bold h-11 px-6 rounded-full text-xs transition border-none mt-2 cursor-pointer"
                    >
                      {isLoading ? 'Saving Changes...' : 'Save Profile Settings'}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl text-foreground"
                >
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Active Sessions & Security Log</h2>
                    <p className="text-xs text-muted-foreground mt-1">Audit recent access events and sign-in activities on your account.</p>
                  </div>

                  <div className="overflow-x-auto border border-border/60 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border font-bold text-foreground">
                          <th className="p-3.5">Event Type</th>
                          <th className="p-3.5">Details</th>
                          <th className="p-3.5">IP Address</th>
                          <th className="p-3.5">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground font-semibold">No recent security events logged.</td>
                          </tr>
                        ) : (
                          logs.map((log, idx) => (
                            <tr key={idx} className="border-b border-border/30 hover:bg-secondary/20">
                              <td className="p-3.5 font-bold tracking-tight text-primary">{log.event_type}</td>
                              <td className="p-3.5 text-muted-foreground">{log.details}</td>
                              <td className="p-3.5 font-mono">{log.ip_address || '127.0.0.1'}</td>
                              <td className="p-3.5 text-slate-400">
                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
