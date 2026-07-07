'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { meetingService } from '@/services/meeting'
import {
  LogOut, Plus, Video, Copy, Check, ArrowRight, Clock, Calendar,
  LayoutDashboard, Users, X, Globe, Tag, AlignLeft, Paperclip, Mail, Sparkles,
  ShieldCheck, KeyRound, Lock, MonitorPlay, Briefcase, GraduationCap, Lightbulb
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

interface MeetingRecord {
  id: string
  meeting_code: string
  created_at: string
  room_name?: string
  scheduled_at?: string
  duration?: number
  duration_minutes?: number
}



export default function DashboardPage() {
  const { user, token, loadProfile, logout } = useAuth()
  const [recentMeetings, setRecentMeetings] = useState<MeetingRecord[]>([])
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [createdScheduledAt, setCreatedScheduledAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [meetingType, setMeetingType] = useState('technical')


  // Meeting types definition
  const meetingTypes = [
    { id: 'technical', label: 'Technical', icon: MonitorPlay, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 'business', label: 'Business', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'brainstorming', label: 'Brainstorm', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'standup', label: 'Standup', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  // Advanced Calendar Scheduler Modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calTitle, setCalTitle] = useState('')
  const [calDate, setCalDate] = useState('')
  const [calTz, setCalTz] = useState('GMT-5 (EST)')
  const [calColor, setCalColor] = useState('blue')
  const [calDesc, setCalDesc] = useState('')
  const [calGuests, setCalGuests] = useState('')
  const [calAttachment, setCalAttachment] = useState('')
  const [calDuration, setCalDuration] = useState(60)
  const [calMeetingType, setCalMeetingType] = useState('technical')

  // Floating AI Assistant states
  const [showFloatingAi, setShowFloatingAi] = useState(false)
  const [floatingAiInput, setFloatingAiInput] = useState('')
  const [floatingAiMessages, setFloatingAiMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: "Hey! I'm your Codovate AI Copilot. Ask me anything about engineering, system design, or meeting setups!" }
  ])
  const [floatingAiLoading, setFloatingAiLoading] = useState(false)

  // Two-Factor Authentication states
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaQr, setMfaQr] = useState<string | null>(null)
  const [mfaSetupCode, setMfaSetupCode] = useState('')
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [passwordResetStatus, setPasswordResetStatus] = useState<string | null>(null)

  const handleFloatingAiSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!floatingAiInput.trim() || floatingAiLoading) return
    const userText = floatingAiInput.trim()
    setFloatingAiMessages(prev => [...prev, { sender: 'user', text: userText }])
    setFloatingAiInput('')
    setFloatingAiLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, chatHistory: [] })
      })
      if (response.ok) {
        const data = await response.json()
        setFloatingAiMessages(prev => [...prev, { sender: 'ai', text: data.text }])
      } else {
        throw new Error()
      }
    } catch (err) {
      setFloatingAiMessages(prev => [...prev, { sender: 'ai', text: "❌ Connection error. Please verify your API keys in `.env.local`." }])
    } finally {
      setFloatingAiLoading(false)
    }
  }

  const fetchSecurityData = async () => {
    try {
      const activeToken = localStorage.getItem('token')
      if (!activeToken) return

      // Fetch profile details including mfa_enabled and role
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const profRes = await fetch(`${backendUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      })
      if (profRes.ok) {
        const prof = await profRes.json()
        setMfaEnabled(prof.mfa_enabled || false)
        useAuth.setState({ user: prof })
      }
    } catch (e) {
      console.error('Failed to load security configurations:', e)
    }
  }

  const handleToggleMfa = async () => {
    const activeToken = localStorage.getItem('token')
    if (!activeToken) return

    if (mfaEnabled) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const res = await fetch(`${backendUrl}/api/mfa-setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ action: 'disable' })
        })
        if (res.ok) {
          setMfaEnabled(false)
          setMfaSecret(null)
          alert('Two-Factor Authentication has been disabled.')
          await fetchSecurityData()
        }
      } catch (e) {
        alert('Failed to disable MFA')
      }
    } else {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const res = await fetch(`${backendUrl}/api/mfa-setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ action: 'generate' })
        })
        if (res.ok) {
          const data = await res.json()
          setMfaSecret(data.secret)
          setMfaQr(data.qrcode)
          setShowMfaSetup(true)
        }
      } catch (e) {
        alert('Failed to generate MFA secret')
      }
    }
  }

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeToken = localStorage.getItem('token')
    if (!activeToken || !mfaSetupCode.trim()) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const res = await fetch(`${backendUrl}/api/mfa-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ action: 'confirm', code: mfaSetupCode })
      })
      const data = await res.json()
      if (res.ok) {
        setMfaEnabled(true)
        setShowMfaSetup(false)
        setMfaSecret(null)
        setMfaSetupCode('')
        alert('Two-Factor Authentication successfully enabled!')
        await fetchSecurityData()
      } else {
        alert(data.error || 'Failed to confirm Two-Factor setup')
      }
    } catch (e) {
      alert('Network error confirming Two-Factor setup')
    }
  }

  const handleRequestPasswordReset = async () => {
    if (!user || !user.email) return
    setPasswordResetStatus('Generating reset link...')
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const res = await fetch(`${backendUrl}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      if (res.ok) {
        setPasswordResetStatus('🔑 Success! A simulated reset link has been printed in your server logs console output.')
      } else {
        setPasswordResetStatus('❌ Failed to request password reset.')
      }
    } catch (e) {
      setPasswordResetStatus('❌ Connection error requesting reset link.')
    }
  }



  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    const init = async () => {
      await loadProfile()
      try {
        const meetings = await meetingService.getRecentMeetings()
        setRecentMeetings(meetings)
      } catch (err) { console.error(err) }
      await fetchSecurityData()
    }
    init()
  }, [token])

  const handleCreateMeeting = async () => {
    setIsCreating(true)
    try {
      const data = await meetingService.createMeeting({ roomName, scheduledAt, type: meetingType })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(scheduledAt || new Date().toISOString())
      const meetings = await meetingService.getRecentMeetings()
      setRecentMeetings(meetings)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create meeting.')
    } finally { setIsCreating(false) }
  }

  const handleCreateCalendarMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calTitle.trim() || !calDate) return
    setIsCreating(true)

    // Serialize calendar options into roomName as a JSON string to avoid DB schema alterations
    const serializedRoomName = JSON.stringify({
      name: calTitle.trim(),
      color: calColor,
      desc: calDesc.trim(),
      tz: calTz,
      guests: calGuests.trim(),
      attachment: calAttachment
    })

    try {
      const data = await meetingService.createMeeting({
        roomName: serializedRoomName,
        scheduledAt: calDate,
        durationMinutes: calDuration,
        guests: calGuests.trim(),
        type: calMeetingType
      })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(calDate)
      
      // Reset forms and close modal
      setCalTitle(''); setCalDate(''); setCalDesc(''); setCalGuests(''); setCalAttachment(''); setCalDuration(60); setCalMeetingType('technical')
      setShowCalendarModal(false)

      const meetings = await meetingService.getRecentMeetings()
      setRecentMeetings(meetings)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to schedule calendar event.')
    } finally { setIsCreating(false) }
  }

  const handleCopyLink = () => {
    if (!createdCode) return
    navigator.clipboard.writeText(`${window.location.origin}/room?id=${createdCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatMeetingDate = (dateStr: string | null) => {
    const dateObj = dateStr ? new Date(dateStr) : new Date()
    try {
      return dateObj.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch (_) {
      return dateStr || ''
    }
  }

  const handleShareWhatsApp = () => {
    if (!createdCode) return
    const meetTitle = roomName.trim() && !roomName.startsWith('{') ? roomName.trim() : 'Developer Collaboration Session'
    const link = `${window.location.origin}/room?id=${createdCode}`
    const dateFormatted = formatMeetingDate(createdScheduledAt)
    const text = `🚀 You're invited to a collaborative session on Codovate Meet!\n\nLet's connect, communicate, and build together in real-time.\n\n📅 *Date & Time:* \n${dateFormatted}\n\n📌 *Topic:* *${meetTitle}*\n\n🔗 *Join the workspace:* \n${link}\n\n🔑 *Or enter this meeting code:* \n*${createdCode}*\n\nPowered by Codovate Meet 💻`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setIsJoining(true); setJoinError(null)
    try {
      const cleanCode = joinCode.trim().toUpperCase()
      await meetingService.validateMeeting(cleanCode)
      window.location.href = `/room?id=${cleanCode}`
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Invalid meeting code')
      setIsJoining(false)
    }
  }

  // Parse rich serialized calendar data
  const parseMeetingName = (nameField?: string) => {
    if (!nameField) return { name: 'Untitled Meeting', color: 'blue', desc: '', tz: '', guests: '', attachment: '' }
    if (nameField.startsWith('{')) {
      try {
        const parsed = JSON.parse(nameField)
        return {
          name: parsed.name || 'Untitled Meeting',
          color: parsed.color || 'blue',
          desc: parsed.desc || '',
          tz: parsed.tz || '',
          guests: parsed.guests || '',
          attachment: parsed.attachment || ''
        }
      } catch (e) {}
    }
    return { name: nameField, color: 'blue', desc: '', tz: '', guests: '', attachment: '' }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Spinning outer loader */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-4 border-t-primary animate-spin" />
            {/* Inner logo */}
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-slate-900 border border-slate-800">
              <img src="/logo.png" className="w-full h-full object-cover" alt="Codovate Logo" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const colorDotClasses: Record<string, string> = {
    red: 'bg-red-950/400',
    blue: 'bg-blue-950/400',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-950/400'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* ── HEADER ── */}
      <header className="bg-primary px-6 flex items-center justify-between z-50 h-16 shadow-lg shadow-primary/25" style={{ borderBottom: '2px solid rgba(147,210,255,0.55)' }}>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/30">
            <img src="/logo.png" className="w-full h-full object-cover" alt="Codovate Meet Logo" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white select-none">Codovate-Meet</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end select-none">
            <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
            <p className="text-[10px] text-blue-200/70">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full premium-card/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm select-none">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <Button variant="outline" size="sm" onClick={logout}
            className="border-white/30 text-white premium-card/10 hover:premium-card/20 hover:border-white/50 font-semibold h-9 rounded-xl">
            <LogOut className="h-4 w-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10">


        {/* Welcome banner */}
        <motion.div {...fadeInUp} className="relative overflow-hidden hero-gradient rounded-2xl p-8 shadow-lg">
          <div className="absolute rounded-full blur-[100px] pointer-events-none w-64 h-64 bg-blue-300/20 top-[-40px] right-0" />
          <div className="relative z-10 select-none">
            <p className="text-blue-200 text-sm font-semibold mb-1">👋 Welcome back</p>
            <h1 className="text-3xl font-black text-white mb-2">{user.name}</h1>
            <p className="text-blue-100/80 text-sm">Create meetings or schedule calendar sessions in your developer workspace.</p>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Create / Schedule Meeting Card */}
          <motion.div {...fadeInUp} className="premium-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r bg-secondary/40 border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-sm shadow-primary/30">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base">New Meeting</h2>
                  <p className="text-xs text-muted-foreground">Generate a shareable meeting link</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCalendarModal(true)}
                variant="outline"
                className="h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5 rounded-lg"
              >
                📅 Schedule Calendar Event
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {createdCode ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center select-none">
                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Your meeting link</p>
                    <p className="font-mono text-sm font-bold text-primary truncate select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/room?id=${createdCode}` : createdCode}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCopyLink} className="flex-1 rounded-xl font-semibold border-border">
                      {copied ? <><Check className="h-4 w-4 mr-2 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Link</>}
                    </Button>
                    <Button className="flex-1 btn-glow text-white font-bold rounded-xl"
                      onClick={() => window.location.href = `/room?id=${createdCode}`}>
                      Start Call <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl border-none shadow-[0_0_15px_rgba(37,211,102,0.2)] flex items-center justify-center gap-2"
                    onClick={handleShareWhatsApp}
                  >
                    <svg viewBox="0 0 448 512" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                    </svg>
                    Share on WhatsApp
                  </Button>
                  <button className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center font-medium"
                    onClick={() => { setCreatedCode(null); setRoomName(''); setScheduledAt('') }}>
                    + Create another meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Meeting Name
                    </label>
                    <Input placeholder="e.g. Sprint Sync, Daily Standup"
                      value={roomName} onChange={(e) => setRoomName(e.target.value)}
                      className="bg-background border-border rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Meeting Type
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {meetingTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setMeetingType(type.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                            meetingType === type.id
                              ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20 scale-[1.02]'
                              : 'border-border bg-background hover:bg-secondary/40 hover:border-primary/50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${type.bg}`}>
                            <type.icon className={`h-4 w-4 ${type.color}`} />
                          </div>
                          <span className="text-[10px] font-bold text-foreground">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Schedule <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                      className="bg-background border-border rounded-xl h-11" />
                  </div>
                  <Button className="w-full btn-glow text-white font-bold rounded-xl h-12"
                    onClick={handleCreateMeeting} disabled={isCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Creating...' : 'Create Instant Meeting'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Join Meeting Card */}
          <motion.div {...fadeInUp} className="premium-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r bg-secondary/40 border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Join Meeting</h2>
                <p className="text-xs text-muted-foreground">Enter a meeting code to join</p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleJoinMeeting} className="space-y-4">
                {joinError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-sm rounded-xl font-medium">
                    ⚠ {joinError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Meeting Code</label>
                  <Input placeholder="CDV-XXXX-XXXX"
                    className="bg-background border-border rounded-xl h-12 uppercase font-mono tracking-widest text-center text-lg font-bold"
                    value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
                  <p className="text-xs text-muted-foreground text-center select-none">Paste the meeting code shared with you</p>
                </div>
                <Button type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white shadow-md shadow-indigo-500/20 border-none cursor-pointer"
                  disabled={isJoining}>
                  {isJoining ? 'Joining...' : <><ArrowRight className="h-4 w-4 mr-2" />Join Meeting</>}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Meeting History Section */}
        <motion.section {...fadeInUp} className="space-y-4">
          <div className="flex items-center gap-3 select-none">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-black text-foreground uppercase tracking-widest text-xs">Upcoming & Recent Meetings</h2>
          </div>

          <div className="premium-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {recentMeetings.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-4 select-none">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">No scheduled sessions</p>
                  <p className="text-sm text-muted-foreground">Schedule a calendar event or create instant meetings above.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/40 border-b border-border select-none">
                    <tr>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Event</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Timezone / Guests</th>
                      <th className="text-right px-6 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentMeetings.map((m) => {
                      const calData = parseMeetingName(m.room_name)
                      
                      return (
                        <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-3 h-3 rounded-full shrink-0 ${colorDotClasses[calData.color] || 'bg-blue-950/400'}`} title={`Color category: ${calData.color}`} />
                              <div>
                                <p className="font-semibold text-foreground text-sm leading-none">{calData.name}</p>
                                {calData.desc && <p className="text-[10px] text-slate-400 mt-1 truncate max-w-44">{calData.desc}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20 select-all">
                              {m.meeting_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-sm">
                            {new Date(m.scheduled_at || m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-sm font-semibold">
                            {m.duration_minutes || 60} mins
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {calData.tz && <p className="font-semibold text-slate-500">{calData.tz}</p>}
                            {calData.guests && <p className="text-[10px] truncate max-w-44 text-slate-400">{calData.guests}</p>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" onClick={() => window.location.href = `/room?id=${m.meeting_code}`}
                              className="bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 font-semibold rounded-lg transition-all h-8">
                              Join →
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── SECURITY SETTINGS SECTION ── */}
        <motion.section {...fadeInUp} className="max-w-2xl mx-auto w-full pt-4">
          {/* Security controls */}
          <div className="premium-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4 select-none">
                <div className="w-9 h-9 rounded-lg bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-center text-indigo-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-sm leading-none">Security Center</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Configure MFA, resets, and RBAC authorization</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {/* Email Verification status */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-bold text-slate-200 text-xs leading-none">Account Status</p>
                      <p className="text-[10px] text-slate-400 mt-1">Verification and validation</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-950/40 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-900/50">
                    ✓ Verified Email
                  </span>
                </div>

                {/* Two Factor setup */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-200 text-xs leading-none">Two-Factor Auth (2FA)</p>
                      <p className="text-[10px] text-slate-400 mt-1">Protect with authenticator codes</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleToggleMfa}
                    className={`h-8 text-xs font-bold px-3 rounded-lg border-none ${mfaEnabled ? 'bg-red-650 hover:bg-red-750 text-white' : 'bg-primary hover:opacity-90 text-white'}`}
                  >
                    {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </div>

                {/* 2FA confirmation input popover */}
                {showMfaSetup && mfaSecret && (
                  <form onSubmit={handleConfirmMfa} className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-slate-300">Set Up Two-Factor Authentication</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Scan QR code or use manual key: <strong className="text-indigo-400 font-mono select-all bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{mfaSecret}</strong>
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter 6-digit confirmation code (e.g. 123456)"
                        value={mfaSetupCode}
                        onChange={(e) => setMfaSetupCode(e.target.value)}
                        className="h-8 bg-slate-850 text-xs text-white border-slate-700"
                        required
                      />
                      <Button type="submit" size="sm" className="h-8 text-xs font-bold px-3 bg-primary border-none">Confirm</Button>
                    </div>
                    <button type="button" onClick={() => setShowMfaSetup(false)} className="text-[10px] text-slate-400 hover:text-white underline bg-transparent border-none">Cancel</button>
                  </form>
                )}

                {/* RBAC details */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl select-none">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-bold text-slate-200 text-xs leading-none">Security Role (RBAC)</p>
                      <p className="text-[10px] text-slate-400 mt-1">Access control groups</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-950/40 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-900/50 uppercase">
                    👥 {user.role || 'user'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset password */}
            <div className="border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPasswordReset}
                className="w-full text-xs font-bold border-border h-10 rounded-xl"
              >
                🔒 Request Password Reset Link
              </Button>
              {passwordResetStatus && (
                <p className="text-[10px] font-semibold mt-2 text-center text-slate-500 leading-tight">
                  {passwordResetStatus}
                </p>
              )}
            </div>
          </div>
        </motion.section>

      </main>

      {/* ── ADVANCED CALENDAR SCHEDULER MODAL ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border"
          >
            {/* Modal header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-base">Schedule Event (Google Calendar)</h3>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleCreateCalendarMeeting} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Event Title</label>
                <Input placeholder="Tech Architecture Review, Sprint Kickoff..." value={calTitle} onChange={(e) => setCalTitle(e.target.value)} required className="h-10 border-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Start Date & Time</label>
                  <Input type="datetime-local" value={calDate} onChange={(e) => setCalDate(e.target.value)} required className="h-10 border-border" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Time Zone</label>
                  <select value={calTz} onChange={(e) => setCalTz(e.target.value)} className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary">
                    <option>GMT-5 (EST)</option>
                    <option>GMT-8 (PST)</option>
                    <option>GMT+0 (UTC)</option>
                    <option>GMT+1 (BST)</option>
                    <option>GMT+5:30 (IST)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Meeting Type</label>
                  <select value={calMeetingType} onChange={(e) => setCalMeetingType(e.target.value)} className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary">
                    <option value="technical">💻 Technical / Code Review</option>
                    <option value="business">💼 Business / Standup</option>
                    <option value="education">🎓 Classroom / Education</option>
                    <option value="brainstorming">💡 Brainstorming</option>
                    <option value="standup">👥 Standup</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /> Event Color</label>
                  <select value={calColor} onChange={(e) => setCalColor(e.target.value)} className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary">
                    <option value="blue">🔵 Royal Blue</option>
                    <option value="red">🔴 Coral Red</option>
                    <option value="green">🟢 Mint Green</option>
                    <option value="yellow">🟡 Amber Yellow</option>
                    <option value="indigo">🟣 Deep Indigo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Duration</label>
                  <select value={calDuration} onChange={(e) => setCalDuration(Number(e.target.value))} className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="90">1.5 Hours</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5 text-primary" /> Attachments</label>
                  <select value={calAttachment} onChange={(e) => setCalAttachment(e.target.value)} className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary">
                    <option value="">No files selected</option>
                    <option value="architecture_doc.pdf">📁 architecture_doc.pdf</option>
                    <option value="product_roadmap.xlsx">📁 product_roadmap.xlsx</option>
                    <option value="sprint_board.json">📁 sprint_board.json</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary" /> Invite Guests (Emails)</label>
                <Input placeholder="developer@company.com..." value={calGuests} onChange={(e) => setCalGuests(e.target.value)} className="h-10 border-border" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><AlignLeft className="h-3.5 w-3.5 text-primary" /> Event Description</label>
                <textarea value={calDesc} onChange={(e) => setCalDesc(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl text-sm text-foreground h-20 outline-none focus:border-primary" placeholder="Define deliverables, agendas, and goals..." />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCalendarModal(false)} className="flex-1 h-11 rounded-xl font-bold border-border">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-glow text-white font-bold h-11 rounded-xl border-none">
                  {isCreating ? 'Saving...' : 'Save & Schedule'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── FLOATING AI ASSISTANT CHAT ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans select-none">
        {showFloatingAi && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96 text-white"
          >
            {/* Header */}
            <div className="bg-slate-955 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</h4>
              </div>
              <button type="button" onClick={() => setShowFloatingAi(false)} className="text-slate-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text custom-scrollbar">
              {floatingAiMessages.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-primary text-white ml-auto' : 'bg-slate-800 text-slate-200 mr-auto'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {floatingAiLoading && (
                <div className="text-[10px] text-slate-400 italic animate-pulse">Thinking...</div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFloatingAiSend} className="p-3 bg-slate-955 border-t border-slate-800 flex gap-2">
              <Input
                placeholder="Ask AI anything..."
                value={floatingAiInput}
                onChange={(e) => setFloatingAiInput(e.target.value)}
                className="h-8 bg-slate-900 border-slate-800 text-xs text-white"
              />
              <Button type="submit" disabled={!floatingAiInput.trim()} className="h-8 text-xs font-bold px-3">
                Send
              </Button>
            </form>
          </motion.div>
        )}

        <button
          onClick={() => setShowFloatingAi(!showFloatingAi)}
          className="w-14 h-14 bg-gradient-to-tr from-primary to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
          title="Ask Codovate AI Anything"
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </button>
      </div>
    </div>
  )
}
