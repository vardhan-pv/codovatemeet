'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { meetingService } from '@/services/meeting'
import {
  LogOut, Plus, Video, Copy, Check, ArrowRight, Clock, Calendar,
  LayoutDashboard, Users, X, Globe, Tag, AlignLeft, Paperclip, Mail, Sparkles,
  ShieldCheck, KeyRound, Lock, MonitorPlay, Briefcase, GraduationCap, Lightbulb, Play, Zap, Shield, Cloud
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

const parseMeetingName = (nameStr?: string) => {
  if (!nameStr) return { name: 'Developer Collaboration Session', desc: '', tz: '', guests: '' }
  try {
    if (nameStr.startsWith('{')) {
      const parsed = JSON.parse(nameStr)
      return {
        name: parsed.name || 'Developer Collaboration Session',
        desc: parsed.desc || '',
        tz: parsed.tz || '',
        guests: parsed.guests || ''
      }
    }
  } catch (_) {}
  return { name: nameStr, desc: '', tz: '', guests: '' }
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
    { id: 'technical', label: 'Instant Meeting', sub: 'Start now', icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { id: 'business', label: 'Schedule Later', sub: 'Plan for later', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { id: 'education', label: 'Recurring', sub: 'Repeat meeting', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  ]

  // Advanced Calendar Scheduler Modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calTitle, setCalTitle] = useState('')
  const [calDate, setCalDate] = useState('')
  const [calTz, setCalTz] = useState('GMT-5 (EST)')
  const [calColor, setCalColor] = useState('blue')
  const [calDesc, setCalDesc] = useState('')
  const [calGuests, setCalGuests] = useState('')
  const [calDuration, setCalDuration] = useState(60)
  const [calMeetingType, setCalMeetingType] = useState('technical')
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false)

  // Track created meeting details for WhatsApp sharing
  const [createdTitle, setCreatedTitle] = useState<string>('')
  const [createdType, setCreatedType] = useState<string>('')
  const [createdDesc, setCreatedDesc] = useState<string>('')

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

  const handleGenerateAiDescription = async () => {
    if (!calTitle.trim()) {
      alert("Please enter an Event Title first to generate a description with AI.")
      return
    }
    setIsGeneratingDesc(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a concise 2-3 sentence professional meeting agenda and description for a developer meeting titled "${calTitle.trim()}" of type "${calMeetingType}". Do not include markdown headers, just clear text context.`,
          chatHistory: []
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.text) {
          setCalDesc(data.text.trim())
          return
        }
      }
      throw new Error()
    } catch (e) {
      setCalDesc(`Agenda & Deliverables for ${calTitle.trim()}:\n- Review key objectives, project scope, and timeline.\n- Discuss ${calMeetingType} requirements and implementation.\n- Action items and next steps sync.`)
    } finally {
      setIsGeneratingDesc(false)
    }
  }

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
        setPasswordResetStatus('🔑 Success! A simulated reset link has been printed in server logs.')
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
      const data = await meetingService.createMeeting({
        roomName: roomName.trim() || 'Instant Developer Session',
        scheduledAt: new Date().toISOString(),
        type: meetingType
      })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(new Date().toISOString())
      setCreatedTitle(roomName.trim() || 'Instant Developer Session')
      setCreatedType(meetingType || 'technical')
      setCreatedDesc('')
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

    const serializedRoomName = JSON.stringify({
      name: calTitle.trim(),
      color: calColor,
      desc: calDesc.trim(),
      tz: calTz,
      guests: calGuests.trim()
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
      setCreatedTitle(calTitle.trim())
      setCreatedType(calMeetingType)
      setCreatedDesc(calDesc.trim())
      
      setCalTitle(''); setCalDate(''); setCalDesc(''); setCalGuests(''); setCalDuration(60); setCalMeetingType('technical')
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

  const handleShareWhatsApp = (customMeeting?: any) => {
    let code = createdCode
    let title = createdTitle || (roomName.trim() && !roomName.startsWith('{') ? roomName.trim() : 'Developer Collaboration Session')
    let timeStr = formatMeetingDate(createdScheduledAt)
    let typeStr = createdType ? (createdType.charAt(0).toUpperCase() + createdType.slice(1)) : 'Technical'
    let desc = createdDesc

    if (customMeeting) {
      code = customMeeting.meeting_code || customMeeting.meetingId
      const parsed = parseMeetingName(customMeeting.room_name || customMeeting.roomName)
      title = parsed.name || title
      desc = parsed.desc || ''
      if (customMeeting.scheduled_at) timeStr = formatMeetingDate(customMeeting.scheduled_at)
      if (customMeeting.type) {
        typeStr = customMeeting.type.charAt(0).toUpperCase() + customMeeting.type.slice(1)
      }
    }

    if (!code) return

    const link = `${window.location.origin}/room?id=${code}`

    let message = `🚀 *You're invited to a Codovate Meet session!*\n\n`
    message += `📌 *Meeting Title:* ${title}\n`
    message += `📅 *Date & Time:* ${timeStr}\n`
    message += `💻 *Meeting Type:* ${typeStr}\n`
    if (desc) {
      message += `📝 *Description:* ${desc}\n`
    }
    message += `\n🔗 *Join Workspace:* \n${link}\n\n`
    message += `🔑 *Meeting Code:* *${code}*\n\n`
    message += `Powered by Codovate Meet 💻`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setIsJoining(true); setJoinError(null)
    try {
      const codeClean = joinCode.trim()
      window.location.href = `/room?id=${codeClean}`
    } catch (err: any) {
      setJoinError('Invalid meeting code or room not found.')
    } finally { setIsJoining(false) }
  }

  const userNameDisplay = user?.name || user?.email?.split('@')[0] || 'codovatesolutions'
  const userEmailDisplay = user?.email || 'codovatesolutions@gmail.com'
  const userInitial = userNameDisplay.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 flex flex-col">

      {/* ── HEADER NAVIGATION ── */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#0B5CFF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
            <Video className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-[#0B5CFF] transition-colors">
              Codovate <span className="text-[#0B5CFF]">Meet</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mt-0.5">
              DEVELOPER WORKSPACE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block leading-tight">
              <p className="font-extrabold text-sm text-slate-900 leading-none">{userNameDisplay}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{userEmailDisplay}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0B5CFF] font-black text-sm flex items-center justify-center border border-blue-200 shadow-xs">
              {userInitial}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={logout}
            className="h-9 px-3 sm:px-4 text-xs font-extrabold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── HERO BANNER ── */}
        <motion.div
          {...fadeInUp}
          className="w-full rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] p-6 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-500/15"
        >
          {/* Background Decorative Rings */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute right-40 bottom-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-1.5 text-blue-100 font-extrabold text-xs tracking-widest uppercase">
                <span>👋</span>
                <span>WELCOME BACK</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-xs">
                {userNameDisplay}
              </h1>
              <p className="text-sm sm:text-base font-medium text-blue-50/90 leading-relaxed max-w-xl">
                Create instant meetings or schedule calendar sessions in your workspace.
              </p>
            </div>

            {/* Glossy 3D Illustration Graphic */}
            <div className="hidden md:flex shrink-0 items-center justify-center relative w-48 h-36">
              <div className="w-36 h-28 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4 flex flex-col justify-between transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-lg bg-white/30 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-20 bg-white/40 rounded-full" />
                  <div className="h-2 w-12 bg-white/20 rounded-full" />
                </div>
                <div className="flex justify-end">
                  <div className="w-7 h-7 rounded-full bg-white text-[#2563EB] flex items-center justify-center font-black text-xs shadow-md">
                    ✓
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-3 flex flex-col justify-between transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black text-white">10:00 AM</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 2-COLUMN MAIN ACTION CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── CARD 1: NEW MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B5CFF]">
                    <Video className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-slate-900 leading-tight">New Meeting</h2>
                    <p className="text-xs font-medium text-slate-400">Generate a shareable meeting link</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCalendarModal(true)}
                  className="h-9 px-3 bg-blue-50/70 hover:bg-blue-100 text-[#0B5CFF] border border-blue-200/80 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schedule Calendar Event</span>
                  <span className="sm:hidden">Schedule</span>
                </Button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0B5CFF]" />
                    Meeting Name
                  </label>
                  <Input
                    placeholder="e.g. Sprint Sync, Daily Standup"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0B5CFF]" />
                    Meeting Type
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {meetingTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = meetingType === type.id
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setMeetingType(type.id)
                            if (type.id !== 'technical') {
                              setShowCalendarModal(true)
                            }
                          }}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'border-2 border-[#0B5CFF] bg-blue-50/60 shadow-xs'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.bg}`}>
                            <Icon className={`w-4 h-4 ${type.color}`} />
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 leading-tight">{type.label}</span>
                          <span className="text-[10px] font-medium text-slate-400">{type.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              <Button
                onClick={handleCreateMeeting}
                disabled={isCreating}
                className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{isCreating ? 'Creating Meeting...' : 'Create Meeting'}</span>
              </Button>
            </div>
          </motion.div>

          {/* ── CARD 2: JOIN MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B5CFF]">
                  <Play className="w-5 h-5 fill-[#0B5CFF] ml-0.5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-slate-900 leading-tight">Join Meeting</h2>
                  <p className="text-xs font-medium text-slate-400">Enter a code to enter a live call</p>
                </div>
              </div>

              {/* Decorative Graphic Banner */}
              <div className="my-4 py-6 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-blue-100/70 flex items-center justify-center relative">
                  <div className="w-10 h-10 rounded-full bg-[#0B5CFF] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/30">
                    +
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-400 border-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-sky-400 border-2 border-white" />
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleJoinMeeting} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0B5CFF]" />
                    Meeting Code
                  </label>
                  <Input
                    placeholder="e.g. AB12-CD34-EF56"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-sm font-semibold tracking-wider focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  {joinError && (
                    <p className="text-xs font-bold text-rose-500 mt-1">{joinError}</p>
                  )}
                </div>

                {/* Join Button */}
                <Button
                  type="submit"
                  disabled={isJoining || !joinCode.trim()}
                  className="w-full h-11 bg-blue-50/80 hover:bg-blue-100 text-[#0B5CFF] font-extrabold text-sm rounded-xl border border-blue-200/80 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#0B5CFF]" />
                  <span>{isJoining ? 'Joining Call...' : 'Join Meeting'}</span>
                </Button>
              </form>
            </div>

            {/* Bottom Right Floating Sparkles Badge */}
            <button
              onClick={() => setShowFloatingAi(true)}
              className="w-11 h-11 rounded-full bg-[#0B5CFF] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 absolute bottom-6 right-6 hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Ask AI Assistant"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
            </button>
          </motion.div>

        </div>

        {/* ── BOTTOM FEATURE BADGES ROW ── */}
        <motion.div
          {...fadeInUp}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B5CFF] border border-blue-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">Secure Meetings</h4>
              <p className="text-[11px] font-medium text-slate-400">End-to-end encrypted</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">High Performance</h4>
              <p className="text-[11px] font-medium text-slate-400">HD video & audio quality</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">Easy Collaboration</h4>
              <p className="text-[11px] font-medium text-slate-400">Chat, share & collaborate</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">Cloud Sync</h4>
              <p className="text-[11px] font-medium text-slate-400">Access anywhere, anytime</p>
            </div>
          </div>
        </motion.div>

        {/* ── CREATED MEETING MODAL POPUP ── */}
        <AnimatePresence>
          {createdCode && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 relative"
              >
                <button
                  onClick={() => setCreatedCode(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B5CFF] mb-4">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-1">Meeting Created Successfully!</h3>
                <p className="text-xs font-medium text-slate-500 mb-6">
                  Share this meeting code or link with your teammates to get started.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Meeting Code</span>
                    <p className="text-lg font-black text-[#0B5CFF] font-mono tracking-widest">{createdCode}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <Button
                      onClick={handleCopyLink}
                      className="flex-1 bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-extrabold text-xs h-10 rounded-xl gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied Link!' : 'Copy Meeting Link'}</span>
                    </Button>
                    <Button
                      onClick={() => handleShareWhatsApp()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-3 rounded-xl gap-1.5 cursor-pointer"
                      title="Share via WhatsApp"
                    >
                      <svg viewBox="0 0 448 512" fill="currentColor" className="h-4 w-4">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.href = `/room?id=${createdCode}`}
                    className="w-full bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-extrabold text-sm h-12 rounded-xl cursor-pointer"
                  >
                    Start Call Now →
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── RECENT MEETINGS HISTORY TABLE SECTION ── */}
        {recentMeetings.length > 0 && (
          <motion.section {...fadeInUp} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0B5CFF]" />
                <h3 className="font-extrabold text-base text-slate-900">Recent Meetings History</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {recentMeetings.length} sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="pb-3">Meeting Name</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Scheduled Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentMeetings.map((m) => {
                    const parsed = parseMeetingName(m.room_name)
                    return (
                      <tr key={m.id || m.meeting_code} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 font-bold text-slate-900">{parsed.name}</td>
                        <td className="py-3 font-mono font-bold text-[#0B5CFF]">{m.meeting_code}</td>
                        <td className="py-3 text-slate-500">{formatMeetingDate(m.scheduled_at || m.created_at)}</td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/room?id=${m.meeting_code}`}
                            className="bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-bold text-xs h-8 px-3 rounded-lg cursor-pointer"
                          >
                            Join →
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

      </main>

      {/* ── ADVANCED CALENDAR SCHEDULER MODAL ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[100] animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900"
          >
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0B5CFF]" />
                <h3 className="font-extrabold text-base">Schedule Event (Google Calendar)</h3>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="text-slate-400 hover:text-slate-900 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCalendarMeeting} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5 text-[#0B5CFF]" /> Event Title</label>
                  <Input placeholder="Tech Architecture Review, Sprint Kickoff..." value={calTitle} onChange={(e) => setCalTitle(e.target.value)} required className="h-10 border border-slate-200 text-slate-900 font-semibold focus:border-[#0B5CFF]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#0B5CFF]" /> Start Date & Time</label>
                    <Input type="datetime-local" value={calDate} onChange={(e) => setCalDate(e.target.value)} required className="h-10 border border-slate-200 text-slate-900 font-semibold focus:border-[#0B5CFF]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-[#0B5CFF]" /> Time Zone</label>
                    <select value={calTz} onChange={(e) => setCalTz(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-semibold outline-none focus:border-[#0B5CFF]">
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
                    <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#0B5CFF]" /> Meeting Type</label>
                    <select value={calMeetingType} onChange={(e) => setCalMeetingType(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-semibold outline-none focus:border-[#0B5CFF]">
                      <option value="technical">💻 Technical / Code Review</option>
                      <option value="business">💼 Business / Standup</option>
                      <option value="education">🎓 Classroom / Education</option>
                      <option value="brainstorming">💡 Brainstorming</option>
                      <option value="standup">👥 Standup</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#0B5CFF]" /> Duration</label>
                    <select value={calDuration} onChange={(e) => setCalDuration(Number(e.target.value))} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-semibold outline-none focus:border-[#0B5CFF]">
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5"><AlignLeft className="h-3.5 w-3.5 text-[#0B5CFF]" /> Event Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingDesc}
                      className="text-[11px] font-extrabold text-[#0B5CFF] hover:bg-blue-50 flex items-center gap-1 bg-blue-50/60 px-2.5 py-1 rounded-lg border border-blue-200 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className={`h-3 w-3 ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                      {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea
                    value={calDesc}
                    onChange={(e) => setCalDesc(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium h-24 outline-none focus:border-[#0B5CFF]"
                    placeholder="Define deliverables, agendas, and goals..."
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowCalendarModal(false)} className="flex-1 h-11 rounded-xl font-extrabold border-slate-200 text-slate-700 cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-extrabold h-11 rounded-xl border-none shadow-md shadow-blue-500/20 cursor-pointer">
                  {isCreating ? 'Saving...' : 'Save & Schedule'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── FLOATING AI ASSISTANT CHAT ── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans select-none">
        {showFloatingAi && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96 text-slate-900"
          >
            <div className="bg-[#0B5CFF] p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-white" /> AI Assistant
                </h4>
              </div>
              <button type="button" onClick={() => setShowFloatingAi(false)} className="text-white/80 hover:text-white transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text custom-scrollbar bg-slate-50">
              {floatingAiMessages.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-[#0B5CFF] text-white ml-auto' : 'bg-white text-slate-900 border border-slate-200 mr-auto shadow-xs'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {floatingAiLoading && (
                <div className="text-[10px] text-slate-400 italic animate-pulse">Thinking...</div>
              )}
            </div>

            <form onSubmit={handleFloatingAiSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <Input
                placeholder="Ask AI anything..."
                value={floatingAiInput}
                onChange={(e) => setFloatingAiInput(e.target.value)}
                className="h-8 bg-slate-50 border-slate-200 text-xs text-slate-900"
              />
              <Button type="submit" disabled={!floatingAiInput.trim()} className="h-8 text-xs font-bold px-3 bg-[#0B5CFF] hover:bg-[#0846CC] text-white border-none cursor-pointer">
                Send
              </Button>
            </form>
          </motion.div>
        )}

        <button
          onClick={() => setShowFloatingAi(!showFloatingAi)}
          className="w-14 h-14 bg-[#0B5CFF] hover:bg-[#0846CC] rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Ask Codovate AI Anything"
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </button>
      </div>
    </div>
  )
}
