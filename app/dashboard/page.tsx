'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { meetingService } from '@/services/meeting'
import {
  LogOut, Plus, Video, Copy, Check, ArrowRight, Clock, Calendar,
  LayoutDashboard, Users, X, Globe, Tag, AlignLeft, Paperclip, Mail, Sparkles,
  ShieldCheck, KeyRound, Lock, MonitorPlay, Briefcase, GraduationCap, Lightbulb, Play
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
    if (!scheduledAt) {
      alert("Please select a date and time to schedule this meeting.")
      return
    }
    setIsCreating(true)
    try {
      const data = await meetingService.createMeeting({ roomName, scheduledAt, type: meetingType })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(scheduledAt || new Date().toISOString())
      setCreatedTitle(roomName.trim() || 'Developer Collaboration Session')
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

    // Serialize calendar options into roomName as a JSON string to avoid DB schema alterations
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
      
      // Reset forms and close modal
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
    if (!nameField) return { name: 'Untitled Meeting', color: 'blue', desc: '', tz: '', guests: '' }
    if (nameField.startsWith('{')) {
      try {
        const parsed = JSON.parse(nameField)
        return {
          name: parsed.name || 'Untitled Meeting',
          color: parsed.color || 'blue',
          desc: parsed.desc || '',
          tz: parsed.tz || '',
          guests: parsed.guests || ''
        }
      } catch (e) {}
    }
    return { name: nameField, color: 'blue', desc: '', tz: '', guests: '' }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Spinning outer loader */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-4 border-t-primary animate-spin" />
            {/* Inner logo */}
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-slate-900 border border-slate-800 relative">
              <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Logo" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Initializing Collaborative Workspace...</p>
        </div>
      </div>
    )
  }

  const colorDotClasses: Record<string, string> = {
    red: 'bg-rose-500',
    blue: 'bg-[#0B5CFF]',
    green: 'bg-[#3EC78F]',
    yellow: 'bg-amber-500',
    indigo: 'bg-[#7B61FF]'
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#3D3D50] flex flex-col font-sans selection:bg-[#EEF4FF]">
      
      {/* ── HEADER ── */}
      <header className="bg-[#FFFFFF] border-b border-[#C4C4CF]/50 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs relative bg-[#F8F9FA] border border-[#C4C4CF]/60">
            <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Meet Logo" />
          </div>
          <div>
            <h1 className="font-extrabold text-[#000000] tracking-tight text-lg leading-none">
              Codovate <span className="text-[#0B5CFF]">Meet</span>
            </h1>
            <p className="text-[10px] text-[#67677E] font-mono mt-0.5 tracking-wider">DEVELOPER WORKSPACE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end select-none">
            <p className="text-sm font-bold text-[#000000] leading-tight">{user.name}</p>
            <p className="text-[11px] text-[#67677E]">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] border border-[#0B5CFF]/30 flex items-center justify-center text-[#0B5CFF] font-bold text-sm select-none">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <Button variant="outline" size="sm" onClick={logout}
            className="border-[#C4C4CF] text-[#232333] hover:bg-[#F8F9FA] font-semibold h-9 rounded-xl transition-all">
            <LogOut className="h-4 w-4 mr-1.5 text-[#67677E]" /> Logout
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10">

        {/* Welcome banner */}
        <motion.div {...fadeInUp} className="relative overflow-hidden bg-gradient-to-r from-[#0B5CFF] to-[#0846CC] rounded-2xl p-8 shadow-md text-white">
          <div className="absolute rounded-full blur-[100px] pointer-events-none w-64 h-64 bg-white/10 top-[-40px] right-0" />
          <div className="relative z-10 select-none">
            <p className="text-[#EEF4FF] text-xs font-bold uppercase tracking-wider mb-1">👋 Welcome back</p>
            <h1 className="text-3xl font-black text-white mb-2">{user.name}</h1>
            <p className="text-white/80 text-sm">Create instant meetings or schedule calendar sessions in your workspace.</p>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Create / Schedule Meeting Card */}
          <motion.div {...fadeInUp} className="bg-[#FFFFFF] border border-[#C4C4CF]/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-[#F8F9FA] border-b border-[#C4C4CF]/60 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-[#C4C4CF]/60 shrink-0 bg-[#F8F9FA]">
                  <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Logo" />
                </div>
                <div>
                  <h2 className="font-bold text-[#000000] text-base">New Meeting</h2>
                  <p className="text-xs text-[#67677E]">Generate a shareable meeting link</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCalendarModal(true)}
                variant="outline"
                className="h-8 text-xs font-bold border-[#0B5CFF] text-[#0B5CFF] hover:bg-[#EEF4FF] rounded-xl"
              >
                📅 Schedule Calendar Event
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {createdCode ? (
                <div className="space-y-4">
                  <div className="bg-[#EEF4FF] border border-[#0B5CFF]/30 rounded-xl p-4 text-center select-none">
                    <p className="text-xs text-[#67677E] mb-1 font-semibold uppercase tracking-wider">Your meeting link</p>
                    <p className="font-mono text-sm font-bold text-[#0B5CFF] truncate select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/room?id=${createdCode}` : createdCode}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCopyLink} className="flex-1 rounded-xl font-semibold border-[#C4C4CF] text-[#232333] hover:bg-[#F8F9FA]">
                      {copied ? <><Check className="h-4 w-4 mr-2 text-[#3EC78F]" /> Copied!</> : <><Copy className="h-4 w-4 mr-2 text-[#67677E]" /> Copy Link</>}
                    </Button>
                    <Button className="flex-1 bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-bold rounded-xl shadow-xs border-none"
                      onClick={() => window.location.href = `/room?id=${createdCode}`}>
                      Start Call <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-[#3EC78F] hover:bg-[#34b07e] text-white font-bold rounded-xl border-none shadow-xs flex items-center justify-center gap-2"
                    onClick={() => handleShareWhatsApp()}
                  >
                    <svg viewBox="0 0 448 512" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                    </svg>
                    Share on WhatsApp
                  </Button>
                  <button className="w-full text-xs text-[#0B5CFF] hover:underline transition-colors text-center font-semibold"
                    onClick={() => { setCreatedCode(null); setRoomName(''); setScheduledAt('') }}>
                    + Create another meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[#232333] flex items-center gap-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 text-[#0B5CFF]" /> Meeting Name
                    </label>
                    <Input placeholder="e.g. Sprint Sync, Daily Standup"
                      value={roomName} onChange={(e) => setRoomName(e.target.value)}
                      className="bg-[#FFFFFF] border-[#C4C4CF] text-[#000000] rounded-xl h-11 focus:border-[#0B5CFF]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[#232333] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#0B5CFF]" /> Meeting Type
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {meetingTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setMeetingType(type.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                            meetingType === type.id
                              ? 'border-[#0B5CFF] bg-[#EEF4FF] text-[#0B5CFF] font-bold shadow-xs'
                              : 'border-[#C4C4CF]/70 bg-[#F8F9FA] text-[#3D3D50] hover:border-[#0B5CFF]/50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${type.bg}`}>
                            <type.icon className={`h-4 w-4 ${type.color}`} />
                          </div>
                          <span className="text-[10px] font-bold">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[#232333] flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#0B5CFF]" /> Schedule Date & Time
                    </label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                      className="bg-[#FFFFFF] border-[#C4C4CF] text-[#000000] rounded-xl h-11 focus:border-[#0B5CFF]" />
                  </div>
                  <Button className="w-full h-11 rounded-xl font-bold bg-[#0B5CFF] hover:bg-[#0846CC] text-white border-none shadow-xs"
                    onClick={handleCreateMeeting} disabled={isCreating}>
                    {isCreating ? 'Creating...' : <><Plus className="h-4 w-4 mr-1.5" /> Schedule Meeting</>}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Join Meeting Card */}
          <motion.div {...fadeInUp} className="bg-[#FFFFFF] border border-[#C4C4CF]/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="bg-[#F8F9FA] border-b border-[#C4C4CF]/60 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B5CFF] flex items-center justify-center shadow-xs">
                  <Play className="h-5 w-5 text-white ml-0.5" />
                </div>
                <div>
                  <h2 className="font-bold text-[#000000] text-base">Join Meeting</h2>
                  <p className="text-xs text-[#67677E]">Enter a code to enter a live call</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center">
              <form onSubmit={handleJoinMeeting} className="space-y-4">
                {joinError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium">
                    ⚠ {joinError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#232333]">Meeting Code</label>
                  <Input placeholder="CDV-XXXX-XXXX"
                    className="bg-[#FFFFFF] border-[#C4C4CF] text-[#000000] rounded-xl h-12 uppercase font-mono tracking-widest text-center text-lg font-bold focus:border-[#0B5CFF]"
                    value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
                  <p className="text-xs text-[#67677E] text-center select-none">Paste the meeting code shared with you</p>
                </div>
                <Button type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-[#0B5CFF] hover:bg-[#0846CC] text-white shadow-xs border-none cursor-pointer"
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
            <Clock className="h-4 w-4 text-[#0B5CFF]" />
            <h2 className="font-black text-[#232333] uppercase tracking-widest text-xs">Upcoming & Recent Meetings</h2>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C4C4CF]/80 rounded-2xl overflow-hidden shadow-xs">
            {recentMeetings.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-4 select-none">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] flex items-center justify-center">
                  <Video className="h-8 w-8 text-[#0B5CFF]" />
                </div>
                <div>
                  <p className="font-bold text-[#000000] mb-1">No scheduled sessions</p>
                  <p className="text-sm text-[#67677E]">Schedule a calendar event or create instant meetings above.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8F9FA] border-b border-[#C4C4CF]/70 select-none">
                    <tr>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Event</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Code</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Date & Time</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Duration</th>
                      <th className="text-left px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Timezone / Guests</th>
                      <th className="text-right px-6 py-3.5 text-xs font-bold text-[#67677E] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C4C4CF]/40">
                    {recentMeetings.map((m) => {
                      const calData = parseMeetingName(m.room_name)
                      
                      return (
                        <tr key={m.id} className="hover:bg-[#EEF4FF]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-3 h-3 rounded-full shrink-0 ${colorDotClasses[calData.color] || 'bg-[#0B5CFF]'}`} title={`Color category: ${calData.color}`} />
                              <div>
                                <p className="font-bold text-[#000000] text-sm leading-none">{calData.name}</p>
                                {calData.desc && <p className="text-xs text-[#67677E] mt-1 truncate max-w-44">{calData.desc}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold bg-[#EEF4FF] text-[#0B5CFF] px-2.5 py-1 rounded-lg border border-[#0B5CFF]/20 select-all">
                              {m.meeting_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#3D3D50] text-sm">
                            {new Date(m.scheduled_at || m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-[#232333] text-sm font-semibold">
                            {m.duration_minutes || 60} mins
                          </td>
                          <td className="px-6 py-4 text-xs text-[#67677E]">
                            {calData.tz && <p className="font-bold text-[#232333]">{calData.tz}</p>}
                            {calData.guests && <p className="text-xs truncate max-w-44 text-[#67677E]">{calData.guests}</p>}
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => handleShareWhatsApp(m)} title="Share meeting details via WhatsApp"
                              className="bg-[#3EC78F]/10 text-[#3EC78F] hover:bg-[#3EC78F] hover:text-white border-0 font-semibold rounded-lg transition-all h-8 px-2.5">
                              <svg viewBox="0 0 448 512" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                              </svg>
                            </Button>
                            <Button size="sm" onClick={() => window.location.href = `/room?id=${m.meeting_code}`}
                              className="bg-[#0B5CFF] text-white hover:bg-[#0846CC] border-0 font-semibold rounded-lg transition-all h-8">
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
          <div className="bg-[#FFFFFF] border border-[#C4C4CF]/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[#C4C4CF]/50 pb-4 mb-4 select-none">
                <div className="w-9 h-9 rounded-lg bg-[#7B61FF]/10 border border-[#7B61FF]/30 flex items-center justify-center text-[#7B61FF]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#000000] text-sm leading-none">Security Center</h3>
                  <p className="text-[11px] text-[#67677E] mt-1">Configure MFA, resets, and authorization</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {/* Email Verification status */}
                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FA] border border-[#C4C4CF]/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#3EC78F]" />
                    <div>
                      <p className="font-bold text-[#000000] text-xs leading-none">Account Status</p>
                      <p className="text-[10px] text-[#67677E] mt-1">Verification and validation</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-[#3EC78F]/10 text-[#3EC78F] px-2.5 py-0.5 rounded-full border border-[#3EC78F]/30">
                    ✓ Verified Email
                  </span>
                </div>

                {/* Two Factor setup */}
                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FA] border border-[#C4C4CF]/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="h-4.5 w-4.5 text-[#0B5CFF]" />
                    <div>
                      <p className="font-bold text-[#000000] text-xs leading-none">Two-Factor Auth (2FA)</p>
                      <p className="text-[10px] text-[#67677E] mt-1">Protect with authenticator codes</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleToggleMfa}
                    className={`h-8 text-xs font-bold px-3 rounded-xl border-none ${mfaEnabled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#0B5CFF] hover:bg-[#0846CC] text-white'}`}
                  >
                    {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </div>

                {/* 2FA confirmation input popover */}
                {showMfaSetup && mfaSecret && (
                  <form onSubmit={handleConfirmMfa} className="p-4 bg-[#F8F9FA] border border-[#C4C4CF] rounded-xl text-[#3D3D50] space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-[#000000]">Set Up Two-Factor Authentication</p>
                    <p className="text-xs text-[#67677E] leading-relaxed">
                      Scan QR code or use manual key: <strong className="text-[#0B5CFF] font-mono select-all bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#0B5CFF]/20">{mfaSecret}</strong>
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter 6-digit code (e.g. 123456)"
                        value={mfaSetupCode}
                        onChange={(e) => setMfaSetupCode(e.target.value)}
                        className="h-8 bg-[#FFFFFF] text-xs text-[#000000] border-[#C4C4CF]"
                        required
                      />
                      <Button type="submit" size="sm" className="h-8 text-xs font-bold px-3 bg-[#0B5CFF] hover:bg-[#0846CC] text-white border-none">Confirm</Button>
                    </div>
                    <button type="button" onClick={() => setShowMfaSetup(false)} className="text-[10px] text-[#67677E] hover:text-[#000000] underline bg-transparent border-none">Cancel</button>
                  </form>
                )}

                {/* RBAC details */}
                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FA] border border-[#C4C4CF]/50 rounded-xl select-none">
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4.5 w-4.5 text-[#0B5CFF]" />
                    <div>
                      <p className="font-bold text-[#000000] text-xs leading-none">Security Role (RBAC)</p>
                      <p className="text-[10px] text-[#67677E] mt-1">Access control groups</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-[#EEF4FF] text-[#0B5CFF] px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/30 uppercase">
                    👥 {user.role || 'user'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset password */}
            <div className="border-t border-[#C4C4CF]/50 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPasswordReset}
                className="w-full text-xs font-bold border-[#C4C4CF] text-[#232333] hover:bg-[#F8F9FA] h-10 rounded-xl"
              >
                🔒 Request Password Reset Link
              </Button>
              {passwordResetStatus && (
                <p className="text-xs font-semibold mt-2 text-center text-[#67677E] leading-tight">
                  {passwordResetStatus}
                </p>
              )}
            </div>
          </div>
        </motion.section>

      </main>

      {/* ── ADVANCED CALENDAR SCHEDULER MODAL ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-[#232333]/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[100] animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#FFFFFF] border border-[#C4C4CF] rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-[#3D3D50]"
          >
            {/* Modal header (Fixed at top) */}
            <div className="px-5 py-4 bg-[#F8F9FA] border-b border-[#C4C4CF]/60 flex justify-between items-center text-[#000000] shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0B5CFF]" />
                <h3 className="font-extrabold text-base">Schedule Event (Google Calendar)</h3>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="text-[#67677E] hover:text-[#000000] transition p-1 rounded-lg hover:bg-[#EEF4FF]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal form & scrollable body */}
            <form onSubmit={handleCreateCalendarMeeting} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5 text-[#0B5CFF]" /> Event Title</label>
                  <Input placeholder="Tech Architecture Review, Sprint Kickoff..." value={calTitle} onChange={(e) => setCalTitle(e.target.value)} required className="h-10 border-[#C4C4CF] text-[#000000] focus:border-[#0B5CFF]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#0B5CFF]" /> Start Date & Time</label>
                    <Input type="datetime-local" value={calDate} onChange={(e) => setCalDate(e.target.value)} required className="h-10 border-[#C4C4CF] text-[#000000] focus:border-[#0B5CFF]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-[#0B5CFF]" /> Time Zone</label>
                    <select value={calTz} onChange={(e) => setCalTz(e.target.value)} className="w-full h-10 bg-[#FFFFFF] border border-[#C4C4CF] rounded-xl px-3 text-sm text-[#000000] outline-none focus:border-[#0B5CFF]">
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
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#0B5CFF]" /> Meeting Type</label>
                    <select value={calMeetingType} onChange={(e) => setCalMeetingType(e.target.value)} className="w-full h-10 bg-[#FFFFFF] border border-[#C4C4CF] rounded-xl px-3 text-sm text-[#000000] outline-none focus:border-[#0B5CFF]">
                      <option value="technical">💻 Technical / Code Review</option>
                      <option value="business">💼 Business / Standup</option>
                      <option value="education">🎓 Classroom / Education</option>
                      <option value="brainstorming">💡 Brainstorming</option>
                      <option value="standup">👥 Standup</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-[#0B5CFF]" /> Event Color</label>
                    <select value={calColor} onChange={(e) => setCalColor(e.target.value)} className="w-full h-10 bg-[#FFFFFF] border border-[#C4C4CF] rounded-xl px-3 text-sm text-[#000000] outline-none focus:border-[#0B5CFF]">
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
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#0B5CFF]" /> Duration</label>
                    <select value={calDuration} onChange={(e) => setCalDuration(Number(e.target.value))} className="w-full h-10 bg-[#FFFFFF] border border-[#C4C4CF] rounded-xl px-3 text-sm text-[#000000] outline-none focus:border-[#0B5CFF]">
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#0B5CFF]" /> Invite Guests (Emails)</label>
                    <Input placeholder="developer@company.com..." value={calGuests} onChange={(e) => setCalGuests(e.target.value)} className="h-10 border-[#C4C4CF] text-[#000000] focus:border-[#0B5CFF]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#67677E] uppercase flex items-center gap-1.5"><AlignLeft className="h-3.5 w-3.5 text-[#0B5CFF]" /> Event Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingDesc}
                      className="text-[11px] font-bold text-[#7B61FF] hover:bg-[#7B61FF]/20 flex items-center gap-1 bg-[#7B61FF]/10 px-2.5 py-1 rounded-lg border border-[#7B61FF]/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`h-3 w-3 ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                      {isGeneratingDesc ? 'Generating with AI...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea
                    value={calDesc}
                    onChange={(e) => setCalDesc(e.target.value)}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#C4C4CF] rounded-xl text-sm text-[#000000] h-24 outline-none focus:border-[#0B5CFF] custom-scrollbar"
                    placeholder="Define deliverables, agendas, and goals..."
                  />
                </div>
              </div>

              {/* Modal Action Footer (Fixed at bottom) */}
              <div className="p-4 bg-[#F8F9FA] border-t border-[#C4C4CF]/60 flex gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowCalendarModal(false)} className="flex-1 h-11 rounded-xl font-bold border-[#C4C4CF] text-[#3D3D50] hover:bg-[#EEF4FF]">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-bold h-11 rounded-xl border-none shadow-xs">
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
            className="w-80 bg-[#FFFFFF] border border-[#C4C4CF] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96 text-[#3D3D50]"
          >
            {/* Header */}
            <div className="bg-[#0B5CFF] p-4 border-b border-[#0846CC] flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#3EC78F] rounded-full animate-ping" />
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1"><Sparkles className="h-4 w-4 text-white" /> AI Assistant</h4>
              </div>
              <button type="button" onClick={() => setShowFloatingAi(false)} className="text-white/80 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text custom-scrollbar bg-[#F8F9FA]">
              {floatingAiMessages.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-[#0B5CFF] text-white ml-auto' : 'bg-[#EEF4FF] text-[#232333] border border-[#C4C4CF]/50 mr-auto'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {floatingAiLoading && (
                <div className="text-[10px] text-[#67677E] italic animate-pulse">Thinking...</div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFloatingAiSend} className="p-3 bg-[#FFFFFF] border-t border-[#C4C4CF] flex gap-2">
              <Input
                placeholder="Ask AI anything..."
                value={floatingAiInput}
                onChange={(e) => setFloatingAiInput(e.target.value)}
                className="h-8 bg-[#F8F9FA] border-[#C4C4CF] text-xs text-[#000000]"
              />
              <Button type="submit" disabled={!floatingAiInput.trim()} className="h-8 text-xs font-bold px-3 bg-[#0B5CFF] hover:bg-[#0846CC] text-white border-none">
                Send
              </Button>
            </form>
          </motion.div>
        )}

        <button
          onClick={() => setShowFloatingAi(!showFloatingAi)}
          className="w-14 h-14 bg-[#0B5CFF] hover:bg-[#0846CC] rounded-full flex items-center justify-center shadow-xl shadow-[#0B5CFF]/30 hover:scale-105 active:scale-95 transition-transform"
          title="Ask Codovate AI Anything"
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </button>
      </div>
    </div>
  )
}
