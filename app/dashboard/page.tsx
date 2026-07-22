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
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
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
  if (!nameStr) return { name: 'Collaboration Session', color: 'blue', desc: '' }
  if (nameStr.startsWith('{')) {
    try {
      const parsed = JSON.parse(nameStr)
      return {
        name: parsed.name || 'Collaboration Session',
        color: parsed.color || 'blue',
        desc: parsed.desc || '',
        tz: parsed.tz,
        guests: parsed.guests
      }
    } catch (_) {}
  }
  return { name: nameStr, color: 'blue', desc: '' }
}

const colorDotClasses: Record<string, string> = {
  blue: 'bg-[#0B5CFF]',
  red: 'bg-[#F43F5E]',
  green: 'bg-[#10B981]',
  yellow: 'bg-[#F59E0B]',
  indigo: 'bg-[#6366F1]'
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

  // Selected meeting card state (instant, schedule, recurring)
  const [selectedCategory, setSelectedCategory] = useState<'instant' | 'later' | 'recurring'>('instant')

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
      setIsGeneratingDesc(false)
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
      const effectiveName = roomName.trim() || 'Instant Meeting'
      const data = await meetingService.createMeeting({
        roomName: effectiveName,
        scheduledAt: scheduledAt || new Date().toISOString(),
        type: 'technical'
      })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(scheduledAt || new Date().toISOString())
      setCreatedTitle(effectiveName)
      setCreatedType('instant')
      setCreatedDesc('')
      
      const meetings = await meetingService.getRecentMeetings()
      setRecentMeetings(meetings)

      // Direct redirection for instant meeting
      if (selectedCategory === 'instant') {
        window.location.href = `/room?id=${data.meetingId}`
        return
      }
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

  const handleJoinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!joinCode.trim()) return
    setIsJoining(true)
    setJoinError(null)
    try {
      const code = joinCode.trim().toUpperCase()
      window.location.href = `/room?id=${code}`
    } catch (err: any) {
      setJoinError('Failed to join meeting. Please verify code.')
    } finally {
      setIsJoining(false)
    }
  }

  const displayUsername = user?.username || user?.name || 'codovatesolutions'
  const displayEmail = user?.email || 'codovatesolutions@gmail.com'
  const firstLetter = (displayUsername.charAt(0) || 'C').toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased">
      
      {/* ── TOP HEADER BAR (Matching Reference Image) ── */}
      <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#0B5CFF] flex items-center justify-center shadow-md shadow-[#0B5CFF]/30 group-hover:scale-105 transition-transform">
            <Video className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight text-[#0F172A] group-hover:text-[#0B5CFF] transition-colors">
              Codovate Meet
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#64748B] uppercase mt-0.5">
              DEVELOPER WORKSPACE
            </span>
          </div>
        </Link>

        {/* Right User Profile Info & Logout */}
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex flex-col items-end leading-tight select-none">
            <span className="font-extrabold text-xs text-[#0F172A]">{displayUsername}</span>
            <span className="text-[11px] text-[#64748B]">{displayEmail}</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] border border-[#BFDBFE]/60 flex items-center justify-center text-[#0B5CFF] font-extrabold text-sm shadow-xs select-none">
            {firstLetter}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="h-8 rounded-full border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#F1F5F9] text-[#334155] font-semibold text-xs px-3.5 shadow-xs flex items-center gap-1.5 transition"
          >
            <LogOut className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* ── HERO WELCOME BANNER (Exact Gradient & 3D Illustration Look) ── */}
        <motion.div
          {...fadeInUp}
          className="relative bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Subtle background decorative shapes */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Left Text Info */}
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase text-amber-300">
              <span>👋</span> WELCOME BACK
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {displayUsername}
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-xl font-normal leading-relaxed pt-1">
              Create instant meetings or schedule calendar sessions in your workspace.
            </p>
          </div>

          {/* Right 3D Illustration Mockup */}
          <div className="relative z-10 shrink-0 w-44 sm:w-56 h-36 sm:h-44 flex items-center justify-center select-none">
            {/* 3D Calendar Graphic Card */}
            <div className="relative w-36 sm:w-44 h-28 sm:h-36 bg-white rounded-2xl shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-300 border-2 border-white/80">
              <div className="bg-[#2563EB] h-6 sm:h-8 rounded-xl w-full flex items-center justify-between px-3 mb-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
                <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-white/90" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`h-2.5 sm:h-3.5 rounded-md ${i === 2 ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`} />
                ))}
              </div>

              {/* Floating 3D Clock Badge */}
              <div className="absolute -bottom-3 -left-4 w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-[#FFFFFF] shadow-xl border-2 border-[#BFDBFE] flex items-center justify-center text-[#2563EB] animate-bounce duration-1000">
                <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-[#2563EB]" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TWO-COLUMN CARDS GRID (New Meeting & Join Meeting) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT CARD: NEW MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] border border-[#BFDBFE]/60 flex items-center justify-center text-[#0B5CFF]">
                    <Video className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-[#0F172A] leading-tight">New Meeting</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Generate a shareable meeting link</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendarModal(true)}
                  className="h-8 rounded-full bg-[#EEF4FF] hover:bg-[#DBEAFE] text-[#0B5CFF] font-bold text-xs px-3.5 border border-[#BFDBFE]/50 shadow-2xs flex items-center gap-1.5 transition"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#0B5CFF]" />
                  <span>Schedule Calendar Event</span>
                </Button>
              </div>

              {/* Form Input 1: Meeting Name */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#334155] flex items-center gap-1.5">
                    <span className="text-[#0B5CFF] font-mono text-sm leading-none">∷</span>
                    <span>Meeting Name</span>
                  </label>
                  <Input
                    placeholder="e.g. Sprint Sync, Daily Standup"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="h-11 bg-[#F8FAFC] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-[#FFFFFF] focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/15 transition px-4"
                  />
                </div>

                {/* Form Input 2: Meeting Type Selector Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#334155] flex items-center gap-1.5">
                    <span className="text-[#0B5CFF] text-sm leading-none">⚙</span>
                    <span>Meeting Type</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {/* Instant Meeting Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('instant')}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'instant'
                          ? 'bg-[#EEF4FF] border-[#0B5CFF] text-[#0B5CFF] shadow-xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${selectedCategory === 'instant' ? 'bg-[#0B5CFF] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        <MonitorPlay className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold leading-tight">Instant Meeting</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Start now</p>
                      </div>
                    </button>

                    {/* Schedule Later Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('later')}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'later'
                          ? 'bg-[#FFF7ED] border-[#F97316] text-[#F97316] shadow-xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${selectedCategory === 'later' ? 'bg-[#F97316] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold leading-tight">Schedule Later</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Plan for later</p>
                      </div>
                    </button>

                    {/* Recurring Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('recurring')}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'recurring'
                          ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981] shadow-xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${selectedCategory === 'recurring' ? 'bg-[#10B981] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold leading-tight">Recurring</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Repeat meeting</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Additional DateTime picker if Schedule Later selected */}
                {selectedCategory === 'later' && (
                  <div className="space-y-1 pt-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-[#334155]">Select Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="h-10 bg-[#F8FAFC] border-[#E2E8F0] rounded-xl text-xs font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Create Button */}
            <Button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="w-full h-11 rounded-xl bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-extrabold text-sm shadow-md shadow-[#0B5CFF]/25 border-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
              <span>{isCreating ? 'Creating...' : 'Create Meeting'}</span>
            </Button>
          </motion.div>

          {/* ── RIGHT CARD: JOIN MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#0B5CFF] flex items-center justify-center text-white shadow-md shadow-[#0B5CFF]/30">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-[#0F172A] leading-tight">Join Meeting</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Enter a code to enter a live call</p>
                </div>
              </div>

              {/* Center Graphic Illustration */}
              <div className="py-4 flex flex-col items-center justify-center text-center relative select-none">
                <div className="w-20 h-20 rounded-full bg-[#EEF4FF] border border-[#BFDBFE]/60 flex items-center justify-center relative shadow-inner">
                  <Users className="h-9 w-9 text-[#0B5CFF]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0B5CFF] text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm">
                    +
                  </div>
                </div>

                {/* Decorative Sparkle Icons */}
                <span className="absolute top-2 left-1/4 text-[#0B5CFF]/40 text-xs font-mono">✦</span>
                <span className="absolute bottom-2 right-1/4 text-[#0B5CFF]/40 text-xs font-mono">✦</span>

                {joinError && (
                  <p className="text-xs text-rose-500 font-bold mt-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                    ⚠ {joinError}
                  </p>
                )}
              </div>

              {/* Form Input: Meeting Code */}
              <form onSubmit={handleJoinMeeting} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#334155]">Meeting Code</label>
                  <Input
                    placeholder="e.g. AB12-CD34-EF56"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="h-11 bg-[#F8FAFC] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-[#FFFFFF] focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/15 transition px-4"
                  />
                </div>

                {/* Join Meeting Button */}
                <Button
                  type="submit"
                  disabled={isJoining}
                  className="w-full h-11 rounded-xl bg-[#EEF4FF] hover:bg-[#DBEAFE] text-[#0B5CFF] font-extrabold text-sm border border-[#BFDBFE]/60 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 text-[#0B5CFF] fill-current" />
                  <span>{isJoining ? 'Joining...' : 'Join Meeting'}</span>
                </Button>
              </form>
            </div>

            {/* Floating Sparkles Action Button in Card Corner */}
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setShowFloatingAi(true)}
                className="w-10 h-10 rounded-full bg-[#0B5CFF] hover:bg-[#0846CC] text-white flex items-center justify-center shadow-lg shadow-[#0B5CFF]/30 hover:scale-105 active:scale-95 transition-transform"
                title="AI Copilot Assistant"
              >
                <Sparkles className="h-5 w-5 text-white" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* ── BOTTOM FEATURES ROW (4 Columns Matching Screenshot) ── */}
        <motion.div {...fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Feature 1: Secure Meetings */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#0B5CFF] flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-[#0F172A] leading-tight">Secure Meetings</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">End-to-end encrypted</p>
            </div>
          </div>

          {/* Feature 2: High Performance */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-[#0F172A] leading-tight">High Performance</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">HD video & audio quality</p>
            </div>
          </div>

          {/* Feature 3: Easy Collaboration */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#0B5CFF] flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-[#0F172A] leading-tight">Easy Collaboration</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">Chat, share & collaborate</p>
            </div>
          </div>

          {/* Feature 4: Cloud Sync */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0">
              <Cloud className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-[#0F172A] leading-tight">Cloud Sync</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">Access anywhere, anytime</p>
            </div>
          </div>

        </motion.div>

        {/* ── MEETING HISTORY SECTION ── */}
        <motion.section {...fadeInUp} className="space-y-3 pt-2">
          <div className="flex items-center gap-2 select-none">
            <Clock className="h-4 w-4 text-[#0B5CFF]" />
            <h3 className="font-extrabold text-xs text-[#475569] uppercase tracking-wider">
              Upcoming & Recent Meetings
            </h3>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
            {recentMeetings.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 select-none">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-[#0B5CFF]">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] text-sm mb-0.5">No scheduled sessions</p>
                  <p className="text-xs text-[#64748B]">Schedule a calendar event or create instant meetings above.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] select-none text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Event</th>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {recentMeetings.map((m) => {
                      const calData = parseMeetingName(m.room_name)
                      return (
                        <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDotClasses[calData.color] || 'bg-[#0B5CFF]'}`} />
                              <div>
                                <p className="font-bold text-[#0F172A] text-xs leading-none">{calData.name}</p>
                                {calData.desc && <p className="text-[11px] text-[#64748B] mt-0.5 truncate max-w-xs">{calData.desc}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold bg-[#EEF4FF] text-[#0B5CFF] px-2 py-0.5 rounded-md border border-[#BFDBFE]/60 select-all">
                              {m.meeting_code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#334155]">
                            {new Date(m.scheduled_at || m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-[#334155]">
                            {m.duration_minutes || 60} mins
                          </td>
                          <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleShareWhatsApp(m)}
                              title="Share via WhatsApp"
                              className="h-8 px-2.5 text-xs font-bold text-[#10B981] bg-[#ECFDF5] hover:bg-[#D1FAE5] rounded-lg border-none"
                            >
                              Share
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.location.href = `/room?id=${m.meeting_code}`}
                              className="h-8 px-3 text-xs font-bold text-white bg-[#0B5CFF] hover:bg-[#0846CC] rounded-lg border-none"
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
            )}
          </div>
        </motion.section>

        {/* ── SECURITY CENTER SECTION ── */}
        <motion.section {...fadeInUp} className="max-w-3xl mx-auto w-full pt-2">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-3 select-none">
              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center text-[#0B5CFF]">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F172A] text-sm leading-none">Security Center</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">Configure authentication and account protection</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                  <div>
                    <p className="font-bold text-[#0F172A] leading-none">Account Status</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Email verified</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-[#ECFDF5] text-[#10B981] px-2 py-0.5 rounded-full">✓ Verified</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#0B5CFF]" />
                  <div>
                    <p className="font-bold text-[#0F172A] leading-none">Two-Factor Auth</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Authenticator protection</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleToggleMfa}
                  className={`h-7 text-[11px] font-bold px-2.5 rounded-lg border-none ${mfaEnabled ? 'bg-rose-600 text-white' : 'bg-[#0B5CFF] text-white'}`}
                >
                  {mfaEnabled ? 'Disable' : 'Enable 2FA'}
                </Button>
              </div>
            </div>

            {showMfaSetup && mfaSecret && (
              <form onSubmit={handleConfirmMfa} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-2">
                <p className="font-bold text-[#0F172A]">Set Up 2FA Key: <code className="bg-[#EEF4FF] text-[#0B5CFF] px-1.5 py-0.5 rounded">{mfaSecret}</code></p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={mfaSetupCode}
                    onChange={(e) => setMfaSetupCode(e.target.value)}
                    className="h-8 bg-white text-xs border-[#E2E8F0]"
                    required
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs font-bold bg-[#0B5CFF] text-white">Confirm</Button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-[#F1F5F9] flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPasswordReset}
                className="text-xs font-bold border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC] h-9 rounded-xl"
              >
                🔒 Request Password Reset Link
              </Button>
              {passwordResetStatus && (
                <p className="text-xs text-[#64748B] font-medium">{passwordResetStatus}</p>
              )}
            </div>
          </div>
        </motion.section>

      </main>

      {/* ── ADVANCED CALENDAR SCHEDULER MODAL ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between items-center text-[#0F172A] shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0B5CFF]" />
                <h3 className="font-extrabold text-base">Schedule Event (Google Calendar)</h3>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="text-[#64748B] hover:text-[#0F172A] transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCalendarMeeting} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
                <div className="space-y-1">
                  <label className="font-extrabold text-[#334155]">Event Title</label>
                  <Input placeholder="Tech Architecture Review..." value={calTitle} onChange={(e) => setCalTitle(e.target.value)} required className="h-10 border-[#E2E8F0]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-[#334155]">Start Date & Time</label>
                    <Input type="datetime-local" value={calDate} onChange={(e) => setCalDate(e.target.value)} required className="h-10 border-[#E2E8F0]" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-[#334155]">Time Zone</label>
                    <select value={calTz} onChange={(e) => setCalTz(e.target.value)} className="w-full h-10 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 text-xs font-semibold">
                      <option>GMT-5 (EST)</option>
                      <option>GMT-8 (PST)</option>
                      <option>GMT+0 (UTC)</option>
                      <option>GMT+5:30 (IST)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[#334155]">Event Description</label>
                  <textarea
                    value={calDesc}
                    onChange={(e) => setCalDesc(e.target.value)}
                    className="w-full p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl text-xs font-medium h-20 outline-none focus:border-[#0B5CFF]"
                    placeholder="Define deliverables and goals..."
                  />
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowCalendarModal(false)} className="flex-1 h-10 rounded-xl font-bold border-[#E2E8F0]">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-bold h-10 rounded-xl border-none">
                  {isCreating ? 'Saving...' : 'Save & Schedule'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── FLOATING AI COPILOT CHAT ── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans select-none">
        {showFloatingAi && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96 text-[#334155]"
          >
            <div className="bg-[#0B5CFF] p-3.5 border-b border-[#0846CC] flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white" />
                <h4 className="font-extrabold text-xs text-white">Codovate AI Assistant</h4>
              </div>
              <button type="button" onClick={() => setShowFloatingAi(false)} className="text-white/80 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text custom-scrollbar bg-[#F8FAFC]">
              {floatingAiMessages.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-[#0B5CFF] text-white ml-auto' : 'bg-[#EEF4FF] text-[#0F172A] border border-[#BFDBFE]/50 mr-auto'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {floatingAiLoading && (
                <div className="text-[10px] text-[#64748B] italic animate-pulse">Thinking...</div>
              )}
            </div>

            <form onSubmit={handleFloatingAiSend} className="p-2.5 bg-[#FFFFFF] border-t border-[#E2E8F0] flex gap-2">
              <Input
                placeholder="Ask AI..."
                value={floatingAiInput}
                onChange={(e) => setFloatingAiInput(e.target.value)}
                className="h-8 bg-[#F8FAFC] border-[#E2E8F0] text-xs text-[#0F172A]"
              />
              <Button type="submit" disabled={!floatingAiInput.trim()} className="h-8 text-xs font-bold px-3 bg-[#0B5CFF] hover:bg-[#0846CC] text-white border-none">
                Send
              </Button>
            </form>
          </motion.div>
        )}
      </div>

    </div>
  )
}
