'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { meetingService } from '@/services/meeting'
import {
  LogOut, Plus, Video, Copy, Check, ArrowRight, Clock, Calendar, Terminal, Layout,
  LayoutDashboard, Users, X, Globe, Tag, AlignLeft, Paperclip, Mail, Sparkles,
  ShieldCheck, KeyRound, Lock, MonitorPlay, Briefcase, GraduationCap, Lightbulb, Play, Zap, Shield, Cloud,
  MessageSquare, Share2, PhoneCall, ChevronDown, ChevronUp, Settings2, Sun, Moon
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/theme-provider'

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
  const { theme, setTheme } = useTheme()
  const [recentMeetings, setRecentMeetings] = useState<MeetingRecord[]>([])
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [createdScheduledAt, setCreatedScheduledAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomPurpose, setRoomPurpose] = useState('')
  const [roomDesc, setRoomDesc] = useState('')
  const [showRoomDesc, setShowRoomDesc] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  // Selected meeting card state (instant, schedule, recurring)
  const [selectedCategory, setSelectedCategory] = useState<'instant' | 'later' | 'recurring'>('instant')

  // Selected meeting type for room allocation (technical, business, educational, startup)
  const [selectedMeetingType, setSelectedMeetingType] = useState<'technical' | 'business' | 'educational' | 'startup'>('technical')

  // Advanced Calendar Scheduler Modal states (matching images 1, 2, 3, 4)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calTitle, setCalTitle] = useState('My Meeting')
  const [calDescExpanded, setCalDescExpanded] = useState(false)
  const [calDesc, setCalDesc] = useState('')
  const [calDate, setCalDate] = useState('')
  const [calTime, setCalTime] = useState('03:30')
  const [calAmPm, setCalAmPm] = useState<'AM' | 'PM'>('PM')
  const [calTz, setCalTz] = useState('(GMT+5:30) India')
  const [calColor, setCalColor] = useState('blue')
  const [calGuests, setCalGuests] = useState('')
  const [calDurationHours, setCalDurationHours] = useState(0)
  const [calDurationMinutes, setCalDurationMinutes] = useState(40)
  const [calMeetingType, setCalMeetingType] = useState<'technical' | 'business' | 'educational' | 'startup'>('technical')
  const [calRecurring, setCalRecurring] = useState(false)
  const [calMeetingIdType, setCalMeetingIdType] = useState<'auto' | 'personal'>('auto')
  const [calPersonalId, setCalPersonalId] = useState('691 209 2953')
  const [calTemplate, setCalTemplate] = useState('Select a template')
  const [calAddWhiteboard, setCalAddWhiteboard] = useState(true)
  const [calAddDocs, setCalAddDocs] = useState(true)
  const [calPasscodeEnabled] = useState(true)
  const [calPasscode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase())
  const [calPurpose, setCalPurpose] = useState('')
  const [calWaitingRoom, setCalWaitingRoom] = useState(false)
  // Admin panel options (controlled by host/admin)
  const [adminMuteOnEntry, setAdminMuteOnEntry] = useState(false)
  const [adminDisableParticipantVideo, setAdminDisableParticipantVideo] = useState(false)
  const [adminLockChat, setAdminLockChat] = useState(false)
  const [adminRequireApproval, setAdminRequireApproval] = useState(false)
  const [adminAllowScreenShare, setAdminAllowScreenShare] = useState(true)
  const [adminShowAdminOptions, setAdminShowAdminOptions] = useState(false)
  const [calEncryption, setCalEncryption] = useState<'enhanced' | 'e2ee'>('enhanced')
  const [calAutoStartAi, setCalAutoStartAi] = useState(false)
  const [calAutoStartQuestions, setCalAutoStartQuestions] = useState(false)
  const [calAutoStartSummary, setCalAutoStartSummary] = useState(true)
  const [calAllowTranscribe, setCalAllowTranscribe] = useState(true)
  const [calTranscribeScope, setCalTranscribeScope] = useState<'all' | 'org'>('all')
  const [calAllowChatBeforeAfter, setCalAllowChatBeforeAfter] = useState(true)
  const [calHostVideo, setCalHostVideo] = useState<'on' | 'off'>('off')
  const [calParticipantVideo, setCalParticipantVideo] = useState<'on' | 'off'>('off')
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false)

  // Track created meeting details for WhatsApp sharing
  const [createdTitle, setCreatedTitle] = useState<string>('')
  const [createdType, setCreatedType] = useState<string>('')
  const [createdDesc, setCreatedDesc] = useState<string>('')
  const [createdPurpose, setCreatedPurpose] = useState<string>('')

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

  const generatePasscode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

  const handleCreateMeeting = async () => {
    setIsCreating(true)
    try {
      const effectiveName = roomName.trim() || `${selectedMeetingType.charAt(0).toUpperCase() + selectedMeetingType.slice(1)} Session`
      const autoCode = generatePasscode()
      const serializedRoomName = JSON.stringify({
        name: effectiveName,
        type: selectedMeetingType,
        color: 'blue',
        purpose: roomPurpose.trim(),
        desc: roomDesc.trim(),
        passcode: autoCode,
      })
      const data = await meetingService.createMeeting({
        roomName: serializedRoomName,
        scheduledAt: scheduledAt || new Date().toISOString(),
        type: selectedMeetingType
      })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(scheduledAt || new Date().toISOString())
      setCreatedTitle(effectiveName)
      setCreatedType(selectedMeetingType)
      setCreatedDesc(roomDesc.trim())
      setCreatedPurpose(roomPurpose.trim())
      
      const meetings = await meetingService.getRecentMeetings()
      setRecentMeetings(meetings)

      // For instant meeting — show share modal first, then user can start call
      setShowShareModal(true)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create meeting.')
    } finally { setIsCreating(false) }
  }

  const handleCreateCalendarMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calTitle.trim()) return
    setIsCreating(true)

    const effectiveDate = calDate || new Date().toISOString().split('T')[0]
    const effectiveTimeStr = `${effectiveDate}T${calTime}:00`
    const durationMins = calDurationHours * 60 + calDurationMinutes

    const serializedRoomName = JSON.stringify({
      name: calTitle.trim(),
      type: calMeetingType,
      color: calColor,
      purpose: calPurpose.trim(),
      desc: calDesc.trim(),
      tz: calTz,
      guests: calGuests.trim(),
      durationMinutes: durationMins,
      passcode: calPasscode,
      waitingRoom: calWaitingRoom,
      encryption: calEncryption,
      addWhiteboard: calAddWhiteboard,
      addDocs: calAddDocs,
      autoAi: calAutoStartAi,
      autoQuestions: calAutoStartQuestions,
      autoSummary: calAutoStartSummary,
      transcribe: calAllowTranscribe,
      transcribeScope: calTranscribeScope,
      chatBeforeAfter: calAllowChatBeforeAfter,
      hostVideo: calHostVideo,
      participantVideo: calParticipantVideo,
      adminOptions: {
        muteOnEntry: adminMuteOnEntry,
        disableParticipantVideo: adminDisableParticipantVideo,
        lockChat: adminLockChat,
        requireApproval: adminRequireApproval,
        allowScreenShare: adminAllowScreenShare
      }
    })

    try {
      const data = await meetingService.createMeeting({
        roomName: serializedRoomName,
        scheduledAt: effectiveTimeStr,
        durationMinutes: durationMins,
        guests: calGuests.trim(),
        type: calMeetingType
      })
      setCreatedCode(data.meetingId)
      setCreatedScheduledAt(effectiveTimeStr)
      setCreatedTitle(calTitle.trim())
      setCreatedType(calMeetingType)
      setCreatedDesc(calDesc.trim())
      setCreatedPurpose(calPurpose.trim())
      
      setShowCalendarModal(false)
      setShowShareModal(true)

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

  const buildInviteMessage = (customMeeting?: any) => {
    let code = createdCode
    let title = createdTitle || 'Collaboration Session'
    let timeStr = formatMeetingDate(createdScheduledAt)
    let typeStr = createdType ? (createdType.charAt(0).toUpperCase() + createdType.slice(1)) : 'Technical'
    let desc = createdDesc
    let purpose = createdPurpose

    if (customMeeting) {
      code = customMeeting.meeting_code || customMeeting.meetingId
      const parsed = parseMeetingName(customMeeting.room_name || customMeeting.roomName)
      title = parsed.name || title
      desc = (parsed as any).desc || ''
      purpose = (parsed as any).purpose || ''
      if (customMeeting.scheduled_at) timeStr = formatMeetingDate(customMeeting.scheduled_at)
      if (customMeeting.type) typeStr = customMeeting.type.charAt(0).toUpperCase() + customMeeting.type.slice(1)
    }

    if (!code) return ''
    const link = `${window.location.origin}/room?id=${code}`

    let msg = `🎯 *You're Invited to a Codovate Meet!*\n`
    msg += `_Your collaborative workspace is ready._\n\n`
    msg += `━━━━━━━━━━━━━━━━━━━━\n`
    msg += `📌 *Meeting Title:* ${title}\n`
    if (purpose) msg += `🎤 *Purpose:* ${purpose}\n`
    msg += `💻 *Meeting Type:* ${typeStr}\n`
    msg += `📅 *Date & Time:* ${timeStr}\n`
    if (desc) msg += `📋 *Description:* ${desc}\n`
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`
    msg += `🔗 *Join Link:*\n${link}\n\n`
    msg += `🔑 *Meeting Code:* \`${code}\`\n\n`
    msg += `━━━━━━━━━━━━━━━━━━━━\n`
    msg += `Thank you for using *Codovate Meet* — your all-in-one collaborative workspace for developers, educators, and teams.\n`
    msg += `🌐 Powered by Codovate Meet`
    return msg
  }

  const handleShareWhatsApp = (customMeeting?: any) => {
    const msg = buildInviteMessage(customMeeting)
    if (!msg) return
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleCopyInviteMsg = (customMeeting?: any) => {
    const msg = buildInviteMessage(customMeeting)
    if (!msg) return
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    })
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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col antialiased">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="bg-card border-b border-border px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left Logo — actual logo image blended */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Codovate Meet Logo"
              fill
              className="object-contain img-blend-soft rounded-xl"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-primary transition-colors">
              Codovate Meet
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              COLLABORATIVE WORKSPACE
            </span>
          </div>
        </Link>

        {/* Right User Profile Info & Logout */}
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex flex-col items-end leading-tight select-none">
            <span className="font-extrabold text-xs text-white">{displayUsername}</span>
            <span className="text-[11px] text-muted-foreground">{displayEmail}</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-extrabold text-sm shadow-xs select-none">
            {firstLetter}
          </div>



          {user && user.role === 'admin' && (
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-border bg-secondary hover:bg-secondary/80 text-slate-200 font-semibold text-xs px-3.5 shadow-xs flex items-center gap-1.5 transition border-none cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          )}

          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border bg-secondary hover:bg-secondary/80 text-slate-200 font-semibold text-xs px-3.5 shadow-xs flex items-center gap-1.5 transition border-none cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Settings</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="h-8 rounded-full border-border bg-secondary hover:bg-secondary/80 text-slate-200 font-semibold text-xs px-3.5 shadow-xs flex items-center gap-1.5 transition border-none cursor-pointer"
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
          className="relative bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6"
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

          {/* Right 3D Illustration Mockup — blended */}
          <div className="relative z-10 shrink-0 w-44 sm:w-60 h-36 sm:h-44 flex items-center justify-center select-none">
            <div className="relative w-44 sm:w-52 h-36 sm:h-44 hover:scale-105 transition-transform duration-300">
              <Image 
                src="/calendar-schedule-3d.png" 
                alt="3D Calendar and Clock Schedule Illustration" 
                fill 
                priority
                className="object-contain img-blend-hero"
              />
            </div>
          </div>
        </motion.div>

        {/* ── TWO-COLUMN CARDS GRID (New Meeting & Join Meeting) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT CARD: NEW MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-card border border-border rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 shrink-0">
                    <Image src="/logo.jpeg" alt="Logo" fill className="object-contain img-blend-soft rounded-xl" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-white leading-tight">New Meeting</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Instant or scheduled workspace</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendarModal(true)}
                  className="h-8 rounded-full bg-secondary hover:bg-secondary/80 text-primary font-bold text-xs px-3.5 border border-border shadow-2xs flex items-center gap-1.5 transition"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#0B5CFF]" />
                  <span>Schedule</span>
                </Button>
              </div>

              <div className="space-y-4">
                {/* Meeting Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Meeting Name</label>
                  <Input
                    placeholder="e.g. Sprint Sync, Daily Standup"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="h-10 bg-input border-border rounded-xl text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:bg-input focus:border-primary transition px-4"
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Purpose <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input
                    placeholder="e.g. Code review, Client demo, Team standup"
                    value={roomPurpose}
                    onChange={(e) => setRoomPurpose(e.target.value)}
                    className="h-10 bg-input border-border rounded-xl text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:bg-input focus:border-primary transition px-4"
                  />
                </div>

                {/* Description toggle */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowRoomDesc(!showRoomDesc)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {showRoomDesc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showRoomDesc ? 'Hide Description' : '+ Add Description'}
                  </button>
                  {showRoomDesc && (
                    <textarea
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      placeholder="Brief agenda or meeting context..."
                      className="w-full p-2.5 bg-input border border-border rounded-xl text-xs font-medium text-white h-16 outline-none focus:border-primary resize-none transition"
                    />
                  )}
                </div>

                {/* Session Mode (Instant / Later / Recurring) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Session Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'instant', label: 'Instant', sub: 'Start now', icon: MonitorPlay, active: 'bg-primary/10 border-primary text-primary', iconActive: 'bg-primary text-white' },
                      { id: 'later', label: 'Scheduled', sub: 'Plan ahead', icon: Calendar, active: 'bg-amber-500/10 border-amber-500 text-amber-500', iconActive: 'bg-amber-500 text-white' },
                      { id: 'recurring', label: 'Recurring', sub: 'Repeat', icon: GraduationCap, active: 'bg-emerald-500/10 border-emerald-500 text-emerald-500', iconActive: 'bg-emerald-500 text-white' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedCategory(t.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          selectedCategory === t.id ? t.active + ' shadow-xs' : 'bg-input border-border text-muted-foreground hover:bg-secondary hover:text-white'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${selectedCategory === t.id ? t.iconActive : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                          <t.icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-[10px] font-extrabold leading-tight">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meeting Type selector (Technical / Business / Educational / Startup) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Meeting Type <span className="text-[10px] text-primary font-bold ml-1">Allocates Room Tools</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'technical', label: 'Technical', icon: Terminal, emoji: '💻', color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
                      { id: 'business', label: 'Business', icon: Briefcase, emoji: '💼', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-400' },
                      { id: 'educational', label: 'Educational', icon: GraduationCap, emoji: '🎓', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
                      { id: 'startup', label: 'Startup', icon: Lightbulb, emoji: '🚀', color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedMeetingType(t.id as any)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer text-left ${
                          selectedMeetingType === t.id
                            ? `${t.color} ring-1 ring-offset-0 font-bold shadow-xs`
                            : 'border-border bg-input text-muted-foreground hover:bg-secondary hover:text-white'
                        }`}
                      >
                        <span className="text-base">{t.emoji}</span>
                        <span className="text-xs font-bold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Allocated tools preview */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {selectedMeetingType === 'technical' && ['💻 Code', '🖥️ Terminal', '🐙 GitHub'].map((b,i) => <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold">{b}</span>)}
                    {selectedMeetingType === 'business' && ['📋 Actions', '📊 Whiteboard', '⚡ Summary'].map((b,i) => <span key={i} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold">{b}</span>)}
                    {selectedMeetingType === 'educational' && ['🎨 Canvas', '📝 Notes', '📊 Polls'].map((b,i) => <span key={i} className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">{b}</span>)}
                    {selectedMeetingType === 'startup' && ['🎯 Lean Canvas', '🚀 Sandbox', '📌 Kanban'].map((b,i) => <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">{b}</span>)}
                  </div>
                </div>

                {/* Schedule date-time if mode is later */}
                {selectedCategory === 'later' && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-300">Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="h-10 bg-input border-border rounded-xl text-xs font-medium text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="w-full h-11 rounded-full bg-[#0B5CFF] hover:bg-[#0846CC] text-white font-extrabold text-sm shadow-md shadow-[#0B5CFF]/25 border-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
              <span>{isCreating ? 'Creating...' : selectedCategory === 'instant' ? 'Create Meeting' : 'Schedule Meeting'}</span>
            </Button>
          </motion.div>

          {/* ── RIGHT CARD: JOIN MEETING ── */}
          <motion.div
            {...fadeInUp}
            className="bg-card border border-border rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#0B5CFF] flex items-center justify-center text-white shadow-md shadow-[#0B5CFF]/30">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-white leading-tight">Join Meeting</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Enter a code to enter a live call</p>
                </div>
              </div>

              {/* Center Graphic Illustration */}
              <div className="py-4 flex flex-col items-center justify-center text-center relative select-none">
                <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center relative shadow-inner">
                  <Users className="h-9 w-9 text-primary" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0B5CFF] text-white flex items-center justify-center font-bold text-xs border-2 border-card shadow-sm">
                    +
                  </div>
                </div>

                {/* Decorative Sparkle Icons */}
                <span className="absolute top-2 left-1/4 text-primary/40 text-xs font-mono">✦</span>
                <span className="absolute bottom-2 right-1/4 text-primary/40 text-xs font-mono">✦</span>

                {joinError && (
                  <p className="text-xs text-rose-500 font-bold mt-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg">
                    ⚠ {joinError}
                  </p>
                )}
              </div>

              {/* Form Input: Meeting Code */}
              <form onSubmit={handleJoinMeeting} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Meeting Code</label>
                  <Input
                    placeholder="e.g. AB12-CD34-EF56"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="h-11 bg-input border-border rounded-xl text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:bg-input focus:border-primary transition px-4"
                  />
                </div>

                {/* Join Meeting Button */}
                <Button
                  type="submit"
                  disabled={isJoining}
                  className="w-full h-11 rounded-full bg-secondary hover:bg-secondary/80 text-primary font-extrabold text-sm border border-border shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 text-primary fill-current" />
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
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white leading-tight">Secure Meetings</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">End-to-end encrypted</p>
            </div>
          </div>

          {/* Feature 2: High Performance */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white leading-tight">High Performance</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">HD video & audio quality</p>
            </div>
          </div>

          {/* Feature 3: Easy Collaboration */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white leading-tight">Easy Collaboration</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Chat, share & collaborate</p>
            </div>
          </div>

          {/* Feature 4: Cloud Sync */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Cloud className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white leading-tight">Cloud Sync</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Access anywhere, anytime</p>
            </div>
          </div>

        </motion.div>

        {/* ── MEETING HISTORY SECTION ── */}
        <motion.section {...fadeInUp} className="space-y-3 pt-2">
          <div className="flex items-center gap-2 select-none">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Upcoming & Recent Meetings
            </h3>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            {recentMeetings.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 select-none">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-0.5">No scheduled sessions</p>
                  <p className="text-xs text-muted-foreground">Schedule a calendar event or create instant meetings above.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary border-b border-border select-none text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Event</th>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentMeetings.map((m) => {
                       const calData = parseMeetingName(m.room_name)
                       return (
                        <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDotClasses[calData.color] || 'bg-[#0B5CFF]'}`} />
                              <div>
                                <p className="font-bold text-white text-xs leading-none">{calData.name}</p>
                                {calData.desc && <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs">{calData.desc}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-border select-all">
                              {m.meeting_code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            {new Date(m.scheduled_at || m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-slate-300">
                            {m.duration_minutes || 60} mins
                          </td>
                          <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleShareWhatsApp(m)}
                              title="Share via WhatsApp"
                              className="h-8 px-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border-none"
                            >
                              Share
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.location.href = `/room?id=${m.meeting_code}`}
                              className="h-8 px-3 text-xs font-bold text-white bg-primary hover:bg-[#004fe6] rounded-full border-none"
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
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3 select-none">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm leading-none">Security Center</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Configure authentication and account protection</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-input border border-border rounded-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                  <div>
                    <p className="font-bold text-white leading-none">Account Status</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Email verified</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full">✓ Verified</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-input border border-border rounded-2xl">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-bold text-white leading-none">Two-Factor Auth</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Authenticator protection</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleToggleMfa}
                  className={`h-7 text-[11px] font-bold px-3 rounded-full border-none ${mfaEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-primary hover:bg-[#004fe6] text-white'}`}
                >
                  {mfaEnabled ? 'Disable' : 'Enable 2FA'}
                </Button>
              </div>
            </div>

            {showMfaSetup && mfaSecret && (
              <form onSubmit={handleConfirmMfa} className="p-3.5 bg-input border border-border rounded-2xl text-xs space-y-2">
                <p className="font-bold text-white">Set Up 2FA Key: <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{mfaSecret}</code></p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={mfaSetupCode}
                    onChange={(e) => setMfaSetupCode(e.target.value)}
                    className="h-8 bg-secondary text-xs border-border text-white rounded-xl"
                    required
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs font-bold bg-primary hover:bg-[#004fe6] text-white rounded-full px-4 border-none">Confirm</Button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPasswordReset}
                className="text-xs font-bold border-border text-slate-300 bg-secondary hover:bg-secondary/80 h-9 rounded-full px-4"
              >
                🔒 Request Password Reset Link
              </Button>
              {passwordResetStatus && (
                <p className="text-xs text-muted-foreground font-medium">{passwordResetStatus}</p>
              )}
            </div>
          </div>
        </motion.section>

      </main>

      {/* ── SHARE MEETING MODAL ── */}
      {showShareModal && createdCode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B5CFF] to-[#004fe6] p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-black text-base">Meeting Ready! 🎉</p>
                    <p className="text-xs text-blue-100 mt-0.5">Share the invite below</p>
                  </div>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-white/70 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Meeting info badge */}
              <div className="bg-input border border-border rounded-2xl p-3.5 space-y-2">
                <p className="font-extrabold text-sm text-white">{createdTitle || 'Collaboration Session'}</p>
                {createdPurpose && <p className="text-xs text-muted-foreground">🎤 {createdPurpose}</p>}
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    {createdType ? createdType.charAt(0).toUpperCase() + createdType.slice(1) : 'Technical'}
                  </span>
                  <span className="text-[11px] bg-secondary text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                    {formatMeetingDate(createdScheduledAt)}
                  </span>
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300">Meeting Link</label>
                <div className="flex items-center gap-2 bg-input border border-border rounded-2xl px-3 py-2.5">
                  <span className="text-xs text-slate-300 font-mono flex-1 truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/room?id=${createdCode}`}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/room?id=${createdCode}`)
                      setCopied(true); setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-primary hover:text-primary/80 transition shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Meeting Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300">Meeting Code</label>
                <div className="flex items-center gap-2 bg-primary/10 border border-border rounded-2xl px-3 py-2.5">
                  <span className="text-sm text-primary font-mono font-black flex-1 tracking-widest">{createdCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCode || '')
                      setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000)
                    }}
                    className="text-primary hover:text-primary/80 transition shrink-0"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp Share */}
                <button
                  onClick={() => handleShareWhatsApp()}
                  className="flex items-center justify-center gap-2 h-10 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-xs transition shadow-sm border-none cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  Share on WhatsApp
                </button>

                {/* Copy Invite Message */}
                <button
                  onClick={() => handleCopyInviteMsg()}
                  className="flex items-center justify-center gap-2 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-slate-300 font-bold text-xs transition border border-border cursor-pointer"
                >
                  {copiedMsg ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                  {copiedMsg ? 'Copied!' : 'Copy Invite'}
                </button>
              </div>

              {/* Start Call */}
              <button
                onClick={() => { setShowShareModal(false); window.location.href = `/room?id=${createdCode}` }}
                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-full bg-primary hover:bg-[#004fe6] text-white font-extrabold text-sm transition shadow-md shadow-primary/25 border-none cursor-pointer"
              >
                <PhoneCall className="h-4.5 w-4.5" />
                Start the Call
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full text-xs text-muted-foreground hover:text-white font-semibold py-1 transition cursor-pointer bg-transparent border-none"
              >
                Close & Continue Later
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── ADVANCED CALENDAR SCHEDULER MODAL (Matching Images 1, 2, 3, 4) ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans text-white"
          >
            {/* Header Navigation & Banner */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] text-white flex justify-between items-center shrink-0 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="text-xs font-bold text-blue-100 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 cursor-pointer"
                >
                  ‹ Back to Meetings
                </button>
                <div>
                  <h3 className="font-black text-lg leading-tight">Schedule Meeting</h3>
                  <p className="text-[11px] text-blue-100 mt-0.5">Configure room options & invite participants</p>
                </div>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="text-white/80 hover:text-white transition relative z-10 bg-transparent border-none cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCalendarMeeting} className="flex flex-col flex-1 overflow-hidden text-slate-300">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-xs">
                
                {/* 1. Topic */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-300">
                    <span className="text-rose-500 mr-1">*</span>Topic
                  </label>
                  <Input
                    placeholder="My Meeting"
                    value={calTitle}
                    onChange={(e) => setCalTitle(e.target.value)}
                    required
                    className="h-10 bg-input border-border focus:border-primary text-sm font-semibold rounded-xl text-white"
                  />
                </div>

                {/* 2. Purpose & Meeting Type Selection (Core Requirement) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300 flex items-center justify-between">
                    <span>Purpose & Meeting Type (Room Option Allocation)</span>
                    <span className="text-[10px] text-primary font-bold">Allocates Workspaces Dynamically</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'technical', label: 'Technical', icon: Terminal, color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
                      { id: 'business', label: 'Business', icon: Briefcase, color: 'border-indigo-500 bg-indigo-500/10 text-indigo-400' },
                      { id: 'educational', label: 'Educational', icon: GraduationCap, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
                      { id: 'startup', label: 'Startup', icon: Lightbulb, color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCalMeetingType(t.id as any)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center ${
                          calMeetingType === t.id
                            ? `${t.color} ring-2 ring-primary/30 font-bold shadow-xs`
                            : 'border-border bg-input text-muted-foreground hover:bg-secondary hover:text-white'
                        }`}
                      >
                        <t.icon className="h-5 w-5" />
                        <span className="text-xs font-extrabold">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Room Option Allocation Badge Box */}
                  <div className="p-3 bg-secondary/40 border border-border rounded-xl space-y-1.5">
                    <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Allocated Room Tools & Options:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {calMeetingType === 'technical' && ['💻 Live Code Editor', '🖥️ Terminal', '🐙 GitHub Sync', '🤖 AI Pair Programmer', '🎨 Architecture Canvas'].map((b, i) => (
                        <span key={i} className="bg-blue-950/80 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md font-bold text-[10px]">{b}</span>
                      ))}
                      {calMeetingType === 'business' && ['📋 Action Items Tracker', '📊 Financial Whiteboard', '⚡ Meeting Summarizer', '📄 Docs & Presentation'].map((b, i) => (
                        <span key={i} className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[10px]">{b}</span>
                      ))}
                      {calMeetingType === 'educational' && ['🎨 Infinite Whiteboard Canvas', '📝 Lecture Notes', '📊 Student Polls & Q&A', '🎙️ Audio Transcribe'].map((b, i) => (
                        <span key={i} className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md font-bold text-[10px]">{b}</span>
                      ))}
                      {calMeetingType === 'startup' && ['🎯 Lean Canvas Builder', '🚀 Rapid Code Sandbox', '💼 Pitch Deck Notes', '📌 Rapid Kanban Board'].map((b, i) => (
                        <span key={i} className="bg-amber-950/80 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md font-bold text-[10px]">{b}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Description Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCalDescExpanded(!calDescExpanded)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      {calDescExpanded ? '− Hide Description' : '+ Add Description'}
                    </button>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingDesc}
                      className="h-6 text-[10px] text-primary hover:bg-secondary font-bold px-2 rounded-md border-none"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isGeneratingDesc ? 'Generating...' : 'AI Auto-Fill Agenda'}
                    </Button>
                  </div>

                  {(calDescExpanded || calDesc) && (
                    <textarea
                      value={calDesc}
                      onChange={(e) => setCalDesc(e.target.value)}
                      className="w-full p-2.5 bg-input border border-border rounded-xl text-xs font-medium text-white h-20 outline-none focus:border-primary shadow-2xs"
                      placeholder="Enter meeting agenda, objectives, and topics..."
                    />
                  )}
                </div>

                {/* 4. When (Date & Time) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300">When</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Input
                      type="date"
                      value={calDate}
                      onChange={(e) => setCalDate(e.target.value)}
                      className="h-10 bg-input border-border text-xs font-semibold rounded-xl text-white"
                    />
                    <select
                      value={calTime}
                      onChange={(e) => setCalTime(e.target.value)}
                      className="h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold text-white outline-none focus:border-primary"
                    >
                      {['01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      value={calAmPm}
                      onChange={(e) => setCalAmPm(e.target.value as any)}
                      className="h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold text-white outline-none focus:border-primary"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* 4b. Purpose of Meeting (distinct from Description) */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-300">Purpose of Meeting</label>
                  <Input
                    placeholder="e.g. Q3 planning, Code review, Client demo"
                    value={calPurpose}
                    onChange={(e) => setCalPurpose(e.target.value)}
                    className="h-10 bg-input border-border focus:border-primary text-xs font-medium rounded-xl text-white"
                  />
                </div>

                {/* 5. Duration */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300">Duration</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={calDurationHours}
                      onChange={(e) => setCalDurationHours(Number(e.target.value))}
                      className="h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold w-28 text-white"
                    >
                      <option value={0}>0 hr</option>
                      <option value={1}>1 hr</option>
                      <option value={2}>2 hr</option>
                    </select>
                    <select
                      value={calDurationMinutes}
                      onChange={(e) => setCalDurationMinutes(Number(e.target.value))}
                      className="h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold w-32 text-white"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={40}>40 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>

                {/* 6. Time Zone (Matching Image 2) */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-300">Time Zone</label>
                  <select
                    value={calTz}
                    onChange={(e) => setCalTz(e.target.value)}
                    className="w-full h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold text-white"
                  >
                    <option>(GMT+5:30) India</option>
                    <option>(GMT-5:00) Eastern Time (US & Canada)</option>
                    <option>(GMT+0:00) Universal Coordinated Time (UTC)</option>
                    <option>(GMT-8:00) Pacific Time (US & Canada)</option>
                    <option>(GMT+1:00) Central European Time</option>
                  </select>
                </div>

                {/* 7. Recurring Meeting Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={calRecurring}
                    onChange={(e) => setCalRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary bg-input"
                  />
                  <span>Recurring meeting</span>
                </label>

                {/* 8. Invitees & Calendar Email Invite Card (Matching Image 2) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300">Invitees</label>
                  <Input
                    placeholder="Enter user names or email addresses"
                    value={calGuests}
                    onChange={(e) => setCalGuests(e.target.value)}
                    className="h-10 bg-input border-border text-xs font-medium rounded-xl text-white"
                  />
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-300">
                    <div className="mt-0.5 text-amber-500 text-base">⚠️</div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">Email Invitation Dispatch</p>
                      <p className="text-[11px] mt-0.5">
                        Participants will automatically receive email invites with join links. <span className="font-bold text-primary underline cursor-pointer">Connect Calendar</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 9. Theme Color Palette Selection */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Theme Color</label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'blue', color: 'bg-[#0B5CFF]' },
                      { id: 'red', color: 'bg-[#F43F5E]' },
                      { id: 'green', color: 'bg-[#10B981]' },
                      { id: 'yellow', color: 'bg-[#F59E0B]' },
                      { id: 'indigo', color: 'bg-[#6366F1]' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCalColor(c.id)}
                        className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center transition ${
                          calColor === c.id ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {calColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10. Meeting ID (Matching Image 2) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300">Meeting ID</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="meetingIdType"
                        checked={calMeetingIdType === 'auto'}
                        onChange={() => setCalMeetingIdType('auto')}
                        className="text-primary"
                      />
                      <span>Generate Automatically</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="meetingIdType"
                        checked={calMeetingIdType === 'personal'}
                        onChange={() => setCalMeetingIdType('personal')}
                        className="text-primary"
                      />
                      <span>Personal Meeting ID {calPersonalId}</span>
                    </label>
                  </div>
                </div>

                {/* 11. Template & Workspace Allocation Badges (Matching Image 2) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-300">Template & Workspaces</label>
                  <select
                    value={calTemplate}
                    onChange={(e) => setCalTemplate(e.target.value)}
                    className="w-full h-10 bg-input border border-border rounded-xl px-3 text-xs font-semibold mb-2 text-white"
                  >
                    <option>Select a template</option>
                    <option>Technical Sprint Review</option>
                    <option>Business Strategy Sync</option>
                    <option>Educational Lecture & Tutorial</option>
                    <option>Startup Pitch & Product Launch</option>
                  </select>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCalAddWhiteboard(!calAddWhiteboard)}
                      className={`h-9 text-xs font-bold rounded-full border ${calAddWhiteboard ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-input text-muted-foreground'} border-none`}
                    >
                      <Layout className="w-3.5 h-3.5 mr-1.5" />
                      {calAddWhiteboard ? '✓ Whiteboard Added' : '+ Add Whiteboard'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCalAddDocs(!calAddDocs)}
                      className={`h-9 text-xs font-bold rounded-full border ${calAddDocs ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-input text-muted-foreground'} border-none`}
                    >
                      <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                      {calAddDocs ? '✓ Docs Added' : '+ Add Docs'}
                    </Button>
                  </div>
                </div>

                {/* 12. Security (Auto-generated passcode) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs">Security</label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={true} readOnly className="w-4 h-4 text-primary bg-input" />
                      <span className="font-bold text-xs text-slate-300">Auto-generated Passcode</span>
                      <span className="font-mono font-black text-xs bg-primary/10 text-primary border border-border px-2 py-0.5 rounded-lg tracking-widest ml-1">{calPasscode}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-6">A unique passcode is auto-generated and shared with invitees in the email.</p>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={calWaitingRoom}
                          onChange={(e) => setCalWaitingRoom(e.target.checked)}
                          className="w-4 h-4 text-primary"
                        />
                        <span>Waiting Room</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground ml-6 mt-0.5">Only users admitted by the host can join the meeting</p>
                    </div>
                  </div>
                </div>

                {/* 13. Encryption (Matching Image 3) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs">Encryption</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="encryptionType"
                        checked={calEncryption === 'enhanced'}
                        onChange={() => setCalEncryption('enhanced')}
                        className="text-primary"
                      />
                      <span>🛡️ Enhanced encryption</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="encryptionType"
                        checked={calEncryption === 'e2ee'}
                        onChange={() => setCalEncryption('e2ee')}
                        className="text-primary"
                      />
                      <span>🔒 End-to-end encryption</span>
                    </label>
                  </div>
                </div>

                {/* 13b. Admin Panel Options */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setAdminShowAdminOptions(!adminShowAdminOptions)}
                    className="flex items-center gap-2 text-xs font-extrabold text-slate-300 cursor-pointer w-full bg-transparent border-none outline-none"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-300" />
                    Admin Panel Controls
                    {adminShowAdminOptions ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  {adminShowAdminOptions && (
                    <div className="bg-input border border-border rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">These settings are enforced during the meeting</p>
                      {[
                        { key: 'muteOnEntry', label: 'Mute all participants on entry', val: adminMuteOnEntry, set: setAdminMuteOnEntry },
                        { key: 'disableParticipantVideo', label: 'Disable participant video by default', val: adminDisableParticipantVideo, set: setAdminDisableParticipantVideo },
                        { key: 'lockChat', label: 'Restrict chat to host only', val: adminLockChat, set: setAdminLockChat },
                        { key: 'requireApproval', label: 'Require host approval to join', val: adminRequireApproval, set: setAdminRequireApproval },
                        { key: 'allowScreenShare', label: 'Allow participants to screen share', val: adminAllowScreenShare, set: setAdminAllowScreenShare },
                      ].map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={opt.val}
                            onChange={(e) => opt.set(e.target.checked)}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 14. Codovate AI Options (Matching Image 4) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Codovate AI
                  </label>

                  <div className="space-y-2 pl-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calAutoStartAi}
                        onChange={(e) => setCalAutoStartAi(e.target.checked)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Automatically start Codovate AI</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calAutoStartQuestions}
                        onChange={(e) => setCalAutoStartQuestions(e.target.checked)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Automatically start meeting questions</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calAutoStartSummary}
                        onChange={(e) => setCalAutoStartSummary(e.target.checked)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Automatically start meeting summary</span>
                    </label>
                  </div>

                  <div className="p-3 bg-primary/10 border border-border rounded-xl text-[11px] text-slate-300 mt-2">
                    <span className="font-bold text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase mr-1.5">NEW</span>
                    <span className="font-semibold">Meeting summary template:</span> You can select summary templates tailored to your meeting type.
                  </div>
                </div>

                {/* 15. My Notes & Transcription (Matching Image 4) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs">My Notes & Transcription</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={calAllowTranscribe}
                      onChange={(e) => setCalAllowTranscribe(e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Allow participants to transcribe meeting with My Notes</span>
                  </label>

                  {calAllowTranscribe && (
                    <div className="pl-6 space-y-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="transcribeScope"
                          checked={calTranscribeScope === 'org'}
                          onChange={() => setCalTranscribeScope('org')}
                        />
                        <span>Only participants in your organization</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="transcribeScope"
                          checked={calTranscribeScope === 'all'}
                          onChange={() => setCalTranscribeScope('all')}
                        />
                        <span>All participants</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 16. Meeting Chat (Matching Image 4) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs">Meeting Chat</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={calAllowChatBeforeAfter}
                      onChange={(e) => setCalAllowChatBeforeAfter(e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Allow users to access meeting chats before and after the meeting</span>
                  </label>
                </div>

                {/* 17. Default Video State (Matching Image 4) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-extrabold text-slate-300 text-xs">Video Default State</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-input p-2.5 rounded-xl border border-border">
                      <span className="font-bold text-xs text-slate-300">Host Video</span>
                      <div className="flex gap-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input type="radio" name="hostVideo" checked={calHostVideo === 'on'} onChange={() => setCalHostVideo('on')} /> On
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input type="radio" name="hostVideo" checked={calHostVideo === 'off'} onChange={() => setCalHostVideo('off')} /> Off
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-input p-2.5 rounded-xl border border-border">
                      <span className="font-bold text-xs text-slate-300">Participant Video</span>
                      <div className="flex gap-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input type="radio" name="partVideo" checked={calParticipantVideo === 'on'} onChange={() => setCalParticipantVideo('on')} /> On
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input type="radio" name="partVideo" checked={calParticipantVideo === 'off'} onChange={() => setCalParticipantVideo('off')} /> Off
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Footer (Matching Image 1 & 4) */}
              <div className="p-4 bg-secondary border-t border-border flex gap-3 shrink-0">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-[#004fe6] text-white font-extrabold h-11 px-8 rounded-full border-none shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isCreating ? 'Saving...' : 'Save & Schedule'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCalendarModal(false)}
                  className="h-11 px-6 rounded-full font-bold border-border text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer"
                >
                  Cancel
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
            className="w-80 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-96 text-slate-200"
          >
            <div className="bg-primary p-3.5 border-b border-primary flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6">
                  <Image src="/ai-copilot-3d.png" alt="AI" fill className="object-contain img-blend" />
                </div>
                <h4 className="font-extrabold text-xs text-white">Codovate AI Copilot</h4>
              </div>
              <button type="button" onClick={() => setShowFloatingAi(false)} className="text-white/80 hover:text-white transition bg-transparent border-none cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text custom-scrollbar bg-input">
              {floatingAiMessages.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-primary text-white ml-auto' : 'bg-secondary text-slate-200 border border-border mr-auto'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {floatingAiLoading && (
                <div className="text-[10px] text-muted-foreground italic animate-pulse">Thinking...</div>
              )}
            </div>

            <form onSubmit={handleFloatingAiSend} className="p-2.5 bg-card border-t border-border flex gap-2">
              <Input
                placeholder="Ask AI..."
                value={floatingAiInput}
                onChange={(e) => setFloatingAiInput(e.target.value)}
                className="h-8 bg-input border-border text-xs text-white rounded-xl"
              />
              <Button type="submit" disabled={!floatingAiInput.trim()} className="h-8 text-xs font-bold px-3 bg-primary hover:bg-[#004fe6] text-white border-none rounded-full cursor-pointer">
                Send
              </Button>
            </form>
          </motion.div>
        )}

        {/* Floating AI Trigger Button */}
        <button
          onClick={() => setShowFloatingAi(!showFloatingAi)}
          className="w-14 h-14 rounded-2xl bg-primary text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center relative group border-2 border-white/20 cursor-pointer"
          title="Toggle AI Copilot"
        >
          <div className="relative w-9 h-9">
            <Image src="/ai-copilot-3d.png" alt="AI Copilot" fill className="object-contain img-blend" />
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white/20 rounded-full" />
        </button>
      </div>

    </div>
  )
}
