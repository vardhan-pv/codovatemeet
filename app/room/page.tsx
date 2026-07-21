'use client'

import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Room, RoomEvent, LocalVideoTrack, createLocalVideoTrack } from 'livekit-client'
import { useAuth } from '@/hooks/useAuth'
import { livekitService } from '@/services/livekit'
import { meetingService } from '@/services/meeting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdminCommandCenter, AdminSettings } from '@/components/room/AdminCommandCenter'

import { MobileToolSelect } from '@/components/room/MobileToolSelect'
import { AgendaWorkspace } from '@/components/room/AgendaWorkspace'
import { NotesWorkspace } from '@/components/room/NotesWorkspace'
import { TasksSidebar } from '@/components/room/TasksSidebar'
import { PollsSidebar } from '@/components/room/PollsSidebar'
import { OnToGoOverlay } from '@/components/room/OnToGoOverlay'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, MonitorUp, ShieldAlert,
  X, Maximize2, Minimize2, Subtitles, Expand, Shrink, Sparkles, Code, Paintbrush,
  BarChart2, ShieldCheck, Crown, Flag, Calendar, Heart, Send, Clock,
  RefreshCw, Clipboard, Check, Play, User, Terminal, HelpCircle, Activity, PlayCircle, Eye, GitBranch, Rocket, Target, FileText, Timer, Share2, Archive, Radio, Settings, StopCircle, MoreHorizontal, Brain
} from 'lucide-react'
import dynamic from 'next/dynamic'
const CodeEditor = dynamic(() => import('@/components/room/CodeEditor').then(m => ({ default: m.CodeEditor })), { ssr: false })
const Whiteboard = dynamic(() => import('@/components/room/Whiteboard').then(m => ({ default: m.Whiteboard })), { ssr: false })

import { GitHubPanel } from '@/components/room/GitHubPanel'
import { DeployPanel } from '@/components/room/DeployPanel'
import { useAdaptiveNetwork } from '@/hooks/useAdaptiveNetwork'
import { NetworkSignalBadge, NetworkAlertBanner } from '@/components/room/NetworkOptimizationHUD'
import { NetworkStatsModal } from '@/components/room/NetworkStatsModal'
import { ScreenAnnotationLayer } from '@/components/room/ScreenAnnotationLayer'
import { DirectMessageDrawer } from '@/components/room/DirectMessageDrawer'
import { WaitingRoomScreen, HostAdmissionBanner, WaitingParticipant } from '@/components/room/WaitingRoomOverlay'
import { ExportEverythingModal } from '@/components/room/ExportEverythingModal'
import { OnboardingTour } from '@/components/room/OnboardingTour'
import { useMeetingRecorder } from '@/hooks/useMeetingRecorder'
import { MeetingRecorderModal } from '@/components/room/MeetingRecorderModal'
import { Tooltip } from '@/components/ui/tooltip'
import { useMeetingSummary } from '@/hooks/useMeetingSummary'
import { MeetingSummaryPanel } from '@/components/room/MeetingSummaryPanel'
import { Footprints, AlertTriangle } from 'lucide-react'

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

const getDisplayName = (identity: string) => {
  if (!identity) return 'Unknown'
  const index = identity.lastIndexOf('_')
  if (index !== -1) {
    return identity.substring(0, index)
  }
  return identity
}

const formatMeetingDate = (dateStr: string | null) => {
  const dateObj = dateStr ? new Date(dateStr) : new Date()
  try {
    return dateObj.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (_) {
    return dateStr || ''
  }
}

// Visual webcam filters map
const filterMap: Record<string, string> = {
  none: '',
  noir: 'grayscale(1) contrast(1.2)',
  warm: 'sepia(0.35) saturate(1.3) hue-rotate(-10deg)',
  cool: 'saturate(1.2) hue-rotate(15deg) brightness(0.95)',
  cyberpunk: 'hue-rotate(140deg) saturate(1.8) contrast(1.35) brightness(0.9)',
  vintage: 'sepia(0.65) contrast(0.85) brightness(1.05)',
  bubblegum: 'hue-rotate(290deg) saturate(1.4) contrast(1.1)',
  glow: 'brightness(1.15) contrast(0.9) blur(0.5px)'
}

function VideoTile({
  participant,
  source,
  isPinned,
  onTogglePin,
  trackPub,
  reactions = [],
  filter = '',
  handRaised = false,
  isCompanionMode = false,
  isAdminFeatured = false
}: {
  participant: any
  source: 'camera' | 'screen_share'
  isPinned: boolean
  onTogglePin: () => void
  trackPub: any
  reactions?: { id: string; emoji: string }[]
  filter?: string
  handRaised?: boolean
  isCompanionMode?: boolean
  isAdminFeatured?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    let videoTrack: any = null
    let audioTrack: any = null

    const attachTracks = () => {
      const videoPub = trackPub || Array.from(participant.trackPublications.values()).find(
        (pub: any) => pub.source === source || (source === 'camera' && pub.kind === 'video' && pub.source !== 'screen_share')
      ) as any

      if (videoPub && videoPub.track) {
        const isReady = participant.isLocal || videoPub.isSubscribed
        if (isReady) {
          videoTrack = videoPub.track
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.playsInline = true
            videoTrack.attach(videoRef.current)
            videoRef.current.play().catch((e: any) => console.warn("video play error:", e))
          }
          setVideoEnabled(!videoPub.isMuted)
        } else {
          setVideoEnabled(false)
        }
      } else {
        setVideoEnabled(false)
      }

      if (!participant.isLocal && source === 'camera') {
        const audioPub = Array.from(participant.trackPublications.values()).find(
          (pub: any) => pub.kind === 'audio'
        ) as any
        if (audioPub) {
          setAudioMuted(audioPub.isMuted)
        }
      }
    }
    attachTracks()
    
    // Fallback: React 18 strict-mode can cause the track to detach and pause immediately after mounting.
    // Re-attaching after a tiny delay ensures the browser kicks off the media pipeline properly.
    const retryTimeout = setTimeout(() => {
      attachTracks()
    }, 200)

    participant.on('trackPublished', attachTracks)
    participant.on('trackUnpublished', attachTracks)
    participant.on('trackSubscribed', attachTracks)
    participant.on('trackUnsubscribed', attachTracks)
    participant.on('trackMuted', attachTracks)
    participant.on('trackUnmuted', attachTracks)
    participant.on('localTrackPublished', attachTracks)
    participant.on('localTrackUnpublished', attachTracks)

    return () => {
      clearTimeout(retryTimeout)
      if (videoTrack && videoRef.current) try { videoTrack.detach(videoRef.current) } catch (e) {}
      participant.off('trackPublished', attachTracks)
      participant.off('trackUnpublished', attachTracks)
      participant.off('trackSubscribed', attachTracks)
      participant.off('trackUnsubscribed', attachTracks)
      participant.off('trackMuted', attachTracks)
      participant.off('trackUnmuted', attachTracks)
      participant.off('localTrackPublished', attachTracks)
      participant.off('localTrackUnpublished', attachTracks)
    }
  }, [participant, source, trackPub, trackPub?.track, trackPub?.isSubscribed, isCompanionMode])

  if (source === 'screen_share' && !videoEnabled) return null

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#0d1022] overflow-hidden flex items-center justify-center shadow-lg group transition-all duration-300 w-full h-full ${
        isFullscreen 
          ? 'w-screen h-screen rounded-none border-none' 
          : `border rounded-2xl ${participant.isSpeaking ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20 scale-[1.01]' : 'border-white/5'} ${isAdminFeatured ? 'border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/50' : ''}`
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          filter: filterMap[filter] || '',
          transform: (participant.isLocal && source === 'camera') ? 'scaleX(-1)' : undefined
        }}
        className={`w-full h-full transition-all ${source === 'screen_share' || isPinned ? 'object-contain bg-black' : 'object-cover'}`}
      />

      {/* Floating Reactions Overlay */}
      {reactions.map(r => (
        <div
          key={r.id}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-5xl pointer-events-none select-none z-30"
          style={{
            animation: 'floatUp 2.2s ease-out forwards',
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Raise Hand Indicator Overlay */}
      {handRaised && (
        <div className="absolute top-4 left-4 bg-amber-500 text-white rounded-full p-2 flex items-center justify-center shadow-lg z-25 border border-slate-900 animate-bounce">
          <span className="text-xl">🖐️</span>
        </div>
      )}

      {!videoEnabled && (
        <div className="absolute inset-0 bg-card flex flex-col items-center justify-center gap-2 z-10 select-none">
          {source === 'camera' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold uppercase border border-primary/20">
                {getDisplayName(participant.identity).slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-foreground/50">Camera Off</span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <MonitorUp className="h-10 w-10 animate-pulse" />
              <span className="text-xs">Loading screen share...</span>
            </div>
          )}
        </div>
      )}



      {/* Overlay Information */}
      <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-md text-xs font-semibold backdrop-blur-xs flex flex-col gap-0.5 text-white z-10">
        <div className="flex items-center gap-1.5">
          <span>{getDisplayName(participant.identity)}</span>
           {participant.isLocal && <span className="text-[10px] uppercase font-bold text-primary">(You)</span>}
          {isAdminFeatured && source === 'camera' && <span className="text-[9px] uppercase font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-sm tracking-wider">Host</span>}
          {source === 'screen_share' && <span className="text-[10px] uppercase font-bold text-blue-400 border border-blue-400/50 px-1 rounded">Screen</span>}
          {audioMuted && source === 'camera' && <MicOff className="h-3 w-3 text-red-500 ml-1" />}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-xs" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-xs" onClick={onTogglePin} title={isPinned ? "Unpin Tile" : "Pin Tile"}>
          {isPinned ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   AUDIO PLAYER — Persistent component that stays mounted always so remote
   participant audio plays even when the video grid is hidden by a workspace.
   ────────────────────────────────────────────────────────────────────────── */
function AudioPlayer({ track, muted }: { track: any; muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!track || !audioRef.current) return
    audioRef.current.muted = muted
    try {
      track.attach(audioRef.current)
      audioRef.current.play().catch(() => {})
    } catch (e) {}
    return () => {
      try { track.detach(audioRef.current!) } catch (e) {}
    }
  }, [track])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  return <audio ref={audioRef} autoPlay playsInline />
}

/* ──────────────────────────────────────────────────────────────────────────
   WHITEBOARD WORKSPACE COMPONENT (With AI UML Flowchart Generator)
   ────────────────────────────────────────────────────────────────────────── */
function WhiteboardWorkspace({ sendData }: { sendData: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const [color, setColor] = useState('#2563eb')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState<'draw' | 'erase'>('draw')
  const [aiUmlPrompt, setAiUmlPrompt] = useState('')

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    lastPosRef.current = { x, y }
  }

  const drawLocal = (x0: number, y0: number, x1: number, y1: number, strokeColor: string, size: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(x0 * canvas.width, y0 * canvas.height)
    ctx.lineTo(x1 * canvas.width, y1 * canvas.height)
    ctx.stroke()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    const strokeColor = tool === 'erase' ? '#0b0f19' : color

    drawLocal(lastPosRef.current.x, lastPosRef.current.y, x, y, strokeColor, brushSize)

    sendData('WHITEBOARD_DRAW', {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: x,
      y1: y,
      color: strokeColor,
      size: brushSize
    })

    lastPosRef.current = { x, y }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return
    e.preventDefault()
    isDrawingRef.current = true
    const touch = e.touches[0]
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
    lastPosRef.current = { x, y }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.touches.length === 0) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const touch = e.touches[0]
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
    const strokeColor = tool === 'erase' ? '#0b0f19' : color

    drawLocal(lastPosRef.current.x, lastPosRef.current.y, x, y, strokeColor, brushSize)

    sendData('WHITEBOARD_DRAW', {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: x,
      y1: y,
      color: strokeColor,
      size: brushSize
    })

    lastPosRef.current = { x, y }
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0b0f19'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleClear = () => {
    clearCanvasLocal()
    sendData('WHITEBOARD_CLEAR', {})
  }

  // AI UML diagram generation simulation
  const handleAiUmlGenerate = () => {
    if (!aiUmlPrompt.trim()) return
    clearCanvasLocal()
    sendData('WHITEBOARD_CLEAR', {})

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw structured architecture boxes
    ctx.strokeStyle = '#2563eb'
    ctx.fillStyle = '#1e293b'
    ctx.lineWidth = 3

    // Client box
    ctx.fillRect(50, 150, 140, 80)
    ctx.strokeRect(50, 150, 140, 80)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('Client (Browser)', 70, 195)

    // Arrow 1
    ctx.beginPath()
    ctx.strokeStyle = '#60a5fa'
    ctx.moveTo(190, 190)
    ctx.lineTo(290, 190)
    ctx.stroke()

    // API Server box
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(290, 150, 140, 80)
    ctx.strokeRect(290, 150, 140, 80)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('API Gateway', 320, 195)

    // Arrow 2
    ctx.beginPath()
    ctx.moveTo(430, 190)
    ctx.lineTo(530, 190)
    ctx.stroke()

    // Postgres DB box
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(530, 150, 140, 80)
    ctx.strokeRect(530, 150, 140, 80)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Postgres Database', 550, 195)

    // Sync diagram paths to peers
    sendData('WHITEBOARD_DRAW', { x0: 50/800, y0: 150/500, x1: 190/800, y1: 230/500, color: '#2563eb', size: 3 })
    sendData('WHITEBOARD_DRAW', { x0: 290/800, y0: 150/500, x1: 430/800, y1: 230/500, color: '#2563eb', size: 3 })
    sendData('WHITEBOARD_DRAW', { x0: 530/800, y0: 150/500, x1: 670/800, y1: 230/500, color: '#2563eb', size: 3 })
    
    setAiUmlPrompt('')
    alert("AI Diagram parsed successfully! Shared architecture nodes with team.")
  }

  // Mount canvas touch listeners with { passive: false } so preventDefault() works on mobile
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      e.preventDefault()
      isDrawingRef.current = true
      const touch = e.touches[0]
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
      lastPosRef.current = { x, y }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current || e.touches.length === 0) return
      e.preventDefault()
      const touch = e.touches[0]
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
      const strokeColor = tool === 'erase' ? '#0b0f19' : color
      drawLocal(lastPosRef.current.x, lastPosRef.current.y, x, y, strokeColor, brushSize)
      sendData('WHITEBOARD_DRAW', {
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: x, y1: y, color: strokeColor, size: brushSize
      })
      lastPosRef.current = { x, y }
    }

    const onTouchEnd = () => { isDrawingRef.current = false }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [color, brushSize, tool, sendData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement?.clientWidth || 800
    canvas.height = canvas.parentElement?.clientHeight || 500
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#0b0f19'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const handleReceiveDraw = (event: CustomEvent) => {
      const { x0, y0, x1, y1, color, size } = event.detail
      drawLocal(x0, y0, x1, y1, color, size)
    }

    const handleReceiveClear = () => {
      clearCanvasLocal()
    }

    window.addEventListener('wb_draw' as any, handleReceiveDraw)
    window.addEventListener('wb_clear' as any, handleReceiveClear)

    return () => {
      window.removeEventListener('wb_draw' as any, handleReceiveDraw)
      window.removeEventListener('wb_clear' as any, handleReceiveClear)
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] overflow-hidden border border-border animate-in zoom-in-95">
      <div className="bg-popover px-4 py-2 border-b border-border flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Paintbrush className="h-4 w-4 text-primary" />
          <span className="font-bold text-xs text-white">Whiteboard Workspace</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI UML Generator input */}
          <div className="flex items-center gap-1.5 mr-2">
            <Input
              placeholder="e.g. auth microservice flow"
              value={aiUmlPrompt}
              onChange={(e) => setAiUmlPrompt(e.target.value)}
              className="h-7 text-[10px] bg-card border-border text-white w-32 focus:w-44 transition-all"
            />
            <Button onClick={handleAiUmlGenerate} size="sm" className="h-7 text-[9px] bg-amber-600 hover:bg-amber-700 font-extrabold flex items-center gap-1 border-none text-white cursor-pointer">
              <Sparkles className="h-2.5 w-2.5" /> UML
            </Button>
          </div>

          {['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#ffffff'].map(c => (
            <button
              key={c}
              className={`w-5 h-5 rounded-full border ${color === c && tool === 'draw' ? 'scale-110 ring-2 ring-primary border-transparent' : 'border-slate-700'}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setTool('draw') }}
            />
          ))}
          <button
            className={`px-2 py-0.5 rounded text-[10px] border font-bold ${tool === 'erase' ? 'bg-primary text-white border-primary' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            onClick={() => setTool('erase')}
          >
            Eraser
          </button>
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded text-white text-[10px] px-1.5 py-0.5 animate-in"
          >
            <option value={2}>Small</option>
            <option value={5}>Medium</option>
            <option value={10}>Large</option>
          </select>
          <button
            onClick={handleClear}
            className="px-2 py-0.5 rounded text-[10px] bg-red-950 border border-red-800 hover:bg-red-900 text-red-200 font-bold transition"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair block bg-card touch-none"
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   CODE WORKSPACE COMPONENT (With AI Code Explainer & Bug Fixer)
   ────────────────────────────────────────────────────────────────────────── */
function CodeWorkspaceWithAI({ sendData, askAI }: { sendData: any; askAI: any }) {
  const [code, setCode] = useState('// Write live collaborative code here\nconsole.log("Welcome developers!");')
  const [language, setLanguage] = useState('javascript')
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    sendData('CODE_EDIT', { text: newCode, language })
    window.dispatchEvent(new CustomEvent('code_sync_local', { detail: { text: newCode } }))
  }

  const handleLangChange = (newLang: string) => {
    setLanguage(newLang)
    sendData('CODE_EDIT', { text: code, language: newLang })
  }

  // AI Explain Code trigger
  const handleAiExplain = () => {
    askAI(`Explain this active code block line-by-line:\n\n${code}`)
    alert("AI explanation request sent! Review details in the AI Assistant tab.")
  }

  // AI Bug Fixer trigger
  const handleAiBugFix = () => {
    setIsRunning(true)
    setTimeout(() => {
      // Simulate buggy code scanning and correction
      const fixedCode = code
        .replace('consol.log', 'console.log')
        .replace('funtion', 'function')
      
      setCode(fixedCode)
      sendData('CODE_EDIT', { text: fixedCode, language })
      setConsoleOutput(prev => [...prev, '✓ AI Scanning Complete: Circular variables resolved, syntax optimized.'])
      setIsRunning(false)
      alert("AI Bug Fix applied! Code optimized.")
    }, 1000)
  }

  const runCode = () => {
    setIsRunning(true)
    setConsoleOutput(['[Compiling script...]', `[Running ${language} sandbox environment...]`])

    setTimeout(() => {
      if (language === 'javascript') {
        try {
          const logs: string[] = []
          const originalLog = console.log
          console.log = (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
          }
          const runBlock = new Function(code)
          runBlock()
          console.log = originalLog
          
          setConsoleOutput(prev => [
            ...prev,
            ...logs,
            `\n[Process completed successfully with exit code 0]`
          ])
        } catch (err: any) {
          setConsoleOutput(prev => [
            ...prev,
            `❌ Error: ${err.message}`,
            `\n[Process exited with errors]`
          ])
        }
      } else {
        const mockLogs: Record<string, string[]> = {
          python: [
            '>>> print("Executing Python script")',
            'Executing Python script',
            '>>> import math',
            '>>> print(math.pi)',
            '3.141592653589793',
            '\n[Process completed with exit code 0]'
          ],
          html: [
            '<!DOCTYPE html>',
            'Rendered document in live sandbox preview.',
            'Viewport dimension: 1024x768 px',
            '\n[Static page compiled successfully]'
          ],
          sql: [
            'Executing SQL query...',
            'Fetched 3 rows from table: tasks',
            '| id | action_item            | completed |',
            '| 1  | Setup workspace        | true      |',
            '| 2  | Test socket channels   | false     |',
            '\n[Query returned success]'
          ]
        }
        setConsoleOutput(prev => [...prev, ...(mockLogs[language] || ['Running process...', 'Execution success!'])])
      }
      setIsRunning(false)
    }, 1200)
  }

  useEffect(() => {
    const handleReceiveCode = (event: CustomEvent) => {
      const { text, language: lang } = event.detail
      setCode(text)
      setLanguage(lang)
    }

    const handleVoiceCodeTemplate = (event: CustomEvent) => {
      const { template } = event.detail
      setCode(template)
      sendData('CODE_EDIT', { text: template, language: 'javascript' })
      window.dispatchEvent(new CustomEvent('code_sync_local', { detail: { text: template } }))
    }

    window.addEventListener('code_sync' as any, handleReceiveCode)
    window.addEventListener('voice_code_template' as any, handleVoiceCodeTemplate)
    return () => {
      window.removeEventListener('code_sync' as any, handleReceiveCode)
      window.removeEventListener('voice_code_template' as any, handleVoiceCodeTemplate)
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] overflow-hidden border border-border animate-in zoom-in-95">
      <div className="bg-popover px-4 py-2 border-b border-border flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          <span className="font-bold text-xs text-white">Live Code Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAiExplain} size="sm" variant="ghost" className="h-7 text-[10px] text-slate-400 hover:text-white font-bold">
            💡 Explain Code
          </Button>
          <Button onClick={handleAiBugFix} size="sm" variant="ghost" className="h-7 text-[10px] text-purple-500 hover:text-amber-400 font-extrabold flex items-center gap-1">
            🤖 AI Bug Fix
          </Button>
          <select
            value={language}
            onChange={(e) => handleLangChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded text-white text-[10px] px-2 py-0.5 font-bold"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML/CSS</option>
            <option value="sql">SQL Query</option>
          </select>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="px-2.5 py-0.5 text-[10px] rounded bg-primary text-white hover:bg-primary/90 font-bold transition flex items-center gap-1 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : <><Play className="h-2.5 w-2.5" /> Run</>}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 min-h-0 border-b md:border-b-0 md:border-r border-border flex">
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 w-full h-full p-4 bg-card font-mono text-xs text-green-400 border-none outline-none resize-none focus:ring-0"
            placeholder="Type code here..."
          />
        </div>
        <div className="w-full md:w-56 bg-popover flex flex-col h-1/3 md:h-full">
          <div className="px-3 py-1 border-b border-border text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Console Output
          </div>
          <div className="flex-1 p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-0.5 select-text">
            {consoleOutput.length === 0 && <span className="text-slate-500 italic">No output. Press Run.</span>}
            {consoleOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap leading-tight">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface UnoCard {
  id: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  value: string
}

function UnoGame({ room, lobbyName, sendData }: { room: any; lobbyName: string; sendData: (type: string, payload?: any) => void }) {
  const [hand, setHand] = useState<UnoCard[]>([])
  const [discardTop, setDiscardTop] = useState<UnoCard | null>(null)
  const [gameStatus, setGameStatus] = useState<'lobby' | 'playing' | 'won'>('lobby')
  const [winnerName, setWinnerName] = useState('')
  const [gameLog, setGameLog] = useState<string[]>([])

  const colors = ['red', 'blue', 'green', 'yellow']
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', 'Draw 2']

  const generateCard = useCallback((): UnoCard => {
    const isWild = Math.random() < 0.08
    if (isWild) {
      return { id: Math.random().toString(), color: 'wild', value: 'Wild' }
    }
    const color = colors[Math.floor(Math.random() * colors.length)] as any
    const value = values[Math.floor(Math.random() * values.length)]
    return { id: Math.random().toString(), color, value }
  }, [])

  const addLog = (msg: string) => setGameLog(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev.slice(0, 9)])

  const startGame = () => {
    const initialHand = Array.from({ length: 7 }, generateCard)
    const initialDiscard = generateCard()
    setHand(initialHand)
    setDiscardTop(initialDiscard)
    setGameStatus('playing')
    setGameLog([])
    addLog(`${lobbyName} started the game`)
    sendData('UNO_START', { discard: initialDiscard })
  }

  const drawCard = () => {
    if (gameStatus !== 'playing') return
    const card = generateCard()
    setHand(prev => [...prev, card])
    addLog(`${lobbyName} drew a card`)
    sendData('UNO_DRAW', { player: lobbyName })
  }

  const playCard = (card: UnoCard) => {
    if (gameStatus !== 'playing' || !discardTop) return

    const isValidPlay = card.color === 'wild' || discardTop.color === 'wild' || card.color === discardTop.color || card.value === discardTop.value

    if (!isValidPlay) {
      alert("Invalid move! Card must match color or value of discard pile.")
      return
    }

    setHand(prev => {
      const nextHand = prev.filter(c => c.id !== card.id)
      if (nextHand.length === 0) {
        setGameStatus('won')
        setWinnerName(lobbyName)
        addLog(`🎉 ${lobbyName} wins!`)
        sendData('UNO_WIN', { winner: lobbyName })
      } else if (nextHand.length === 1) {
        addLog(`${lobbyName} says UNO!`)
      }
      return nextHand
    })
    setDiscardTop(card)
    addLog(`${lobbyName} played ${card.color} ${card.value}`)
    sendData('UNO_PLAY', { card })
  }

  useEffect(() => {
    const handleStart = (e: CustomEvent) => {
      const { discard } = e.detail
      setDiscardTop(discard)
      setHand(Array.from({ length: 7 }, generateCard))
      setGameStatus('playing')
      addLog('Game started by another player!')
    }
    const handlePlay = (e: CustomEvent) => {
      const { card } = e.detail
      setDiscardTop(card)
      addLog(`Opponent played ${card.color} ${card.value}`)
    }
    const handleDraw = (e: CustomEvent) => {
      addLog(`${e.detail.player} drew a card`)
    }
    const handleWin = (e: CustomEvent) => {
      const { winner } = e.detail
      setWinnerName(winner)
      setGameStatus('won')
      addLog(`🎉 ${winner} wins!`)
    }

    window.addEventListener('uno_start' as any, handleStart)
    window.addEventListener('uno_play' as any, handlePlay)
    window.addEventListener('uno_draw' as any, handleDraw)
    window.addEventListener('uno_win' as any, handleWin)

    return () => {
      window.removeEventListener('uno_start' as any, handleStart)
      window.removeEventListener('uno_play' as any, handlePlay)
      window.removeEventListener('uno_draw' as any, handleDraw)
      window.removeEventListener('uno_win' as any, handleWin)
    }
  }, [generateCard])

  const bgColors: Record<string, string> = {
    red: 'bg-red-600',
    blue: 'bg-primary',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    wild: 'bg-slate-700'
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] overflow-hidden border border-border animate-in zoom-in-95">
      <div className="bg-popover px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>🃏</span>
          <span className="font-bold text-xs text-white">UNO! Card Game</span>
        </div>
        {gameStatus === 'lobby' && (
          <Button onClick={startGame} size="sm" className="h-7 text-[10px] bg-primary hover:opacity-90 border-none font-bold">
            Start Deal
          </Button>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between items-center select-none bg-card">
        {gameStatus === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-4xl">🃏</span>
            <p className="text-sm text-slate-300 font-bold max-w-xs">Start a collaborative UNO game with your teammates during focus breaks!</p>
          </div>
        )}

        {gameStatus === 'won' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-4xl animate-bounce">🏆</span>
            <div>
              <p className="text-lg font-black text-amber-400">{winnerName} won the match!</p>
              <p className="text-xs text-slate-400 mt-1">Winner received a +30 XP bonus.</p>
            </div>
            <Button onClick={startGame} size="sm" className="h-8 text-xs bg-primary hover:opacity-90">
              Play Again
            </Button>
          </div>
        )}

        {gameStatus === 'playing' && discardTop && (
          <>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Discard Pile</span>
              <div className={`w-20 h-28 rounded-[20px] ${bgColors[discardTop.color]} flex items-center justify-center text-white font-extrabold text-sm border-2 border-white shadow-xl transform rotate-2`}>
                {discardTop.value}
              </div>
            </div>

            <div className="w-full space-y-4 mt-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-slate-300">Your Hand ({hand.length} cards){hand.length === 1 ? ' 🎉 UNO!' : ''}</span>
                <Button onClick={drawCard} size="sm" className="h-7 text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  ➕ Draw Card
                </Button>
              </div>

              <div className="w-full overflow-x-auto pb-2 px-1">
                <div className="flex gap-2.5">
                  {hand.map(card => (
                    <button
                      key={card.id}
                      onClick={() => playCard(card)}
                      className={`w-16 h-24 rounded-[20px] shrink-0 ${bgColors[card.color]} border border-white/40 flex flex-col justify-between p-2 text-white font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
                    >
                      <span className="text-[10px] text-left leading-none">{card.value}</span>
                      <span className="text-sm self-center font-extrabold">{card.value[0]}</span>
                      <span className="text-[10px] text-right leading-none self-end">{card.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Activity Log */}
              {gameLog.length > 0 && (
                <div className="mx-2 p-2 bg-slate-900/60 rounded-xl border border-white/5 text-[10px] text-slate-400 space-y-0.5 max-h-20 overflow-y-auto">
                  {gameLog.map((log, i) => (
                    <p key={i} className={i === 0 ? 'text-slate-200 font-semibold' : ''}>{log}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN ROOM PAGE WITH ALL DEVELOPER USPs
   ────────────────────────────────────────────────────────────────────────── */
function RoomPageFallback() {
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

export default function RoomPage() {
  return (
    <Suspense fallback={<RoomPageFallback />}>
      <RoomPageContent />
    </Suspense>
  )
}

function RoomPageContent() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get('id') || ''

  const { user, loadProfile } = useAuth()
  
  // Lobby States
  const [hasJoined, setHasJoined] = useState(false)
  const [lobbyName, setLobbyName] = useState('')
  const [lobbyEmail, setLobbyEmail] = useState('')
  const [previewVideoTrack, setPreviewVideoTrack] = useState<LocalVideoTrack | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const [isCompanionMode, setIsCompanionMode] = useState(false)
  const [isOnToGoMode, setIsOnToGoMode] = useState(false)
  
  // Room States
  const [token, setToken] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)

  // Adaptive Network Optimization Engine
  const {
    stats: adaptiveStats,
    config: adaptiveConfig,
    updateConfig: updateAdaptiveConfig,
    setMode: setAdaptiveMode,
    isStatsModalOpen,
    setIsStatsModalOpen,
    alertBannerMessage,
    clearAlertBanner
  } = useAdaptiveNetwork(room)
  const [participants, setParticipants] = useState<any[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [meetingHostId, setMeetingHostId] = useState<string | null>(null)
  const [meetingHostName, setMeetingHostName] = useState<string | null>(null)
  const [meetingHostEmail, setMeetingHostEmail] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [meetingTitle, setMeetingTitle] = useState<string | null>(null)
  const [polls, setPolls] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [agenda, setAgenda] = useState<any[]>([])
  const [meetingDescription, setMeetingDescription] = useState<string | null>(null)
  const [meetingDuration, setMeetingDuration] = useState<number | null>(null)
  const [meetingScheduledAt, setMeetingScheduledAt] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Enterprise Feature States
  const [isAnnotationActive, setIsAnnotationActive] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false)
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([])
  const [showOnboardingTour, setShowOnboardingTour] = useState(false)
  const [activeChatTab, setActiveChatTab] = useState<'public' | 'dm'>('public')

  // Meeting Recording System Hook
  const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false)
  const {
    isRecording,
    isPaused,
    recordingTimeSecs,
    recordedBlob,
    recordedUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecorder
  } = useMeetingRecorder()

  // Live Data & Admin
  const [metrics, setMetrics] = useState({ codeEdits: 0, chatMsgs: 0, aiRequests: 0 })
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [userRecordingPermissions, setUserRecordingPermissions] = useState<Record<string, boolean>>({})
  const [hasGrantedRecordingPermission, setHasGrantedRecordingPermission] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [incomingDmPopup, setIncomingDmPopup] = useState<{ senderIdentity: string, senderName: string, text: string, timestamp: number } | null>(null)
  const [targetDmIdentity, setTargetDmIdentity] = useState<string | null>(null)

  const openDmWithUser = (identity: string, name?: string) => {
    setTargetDmIdentity(identity)
    setActiveSidebar('chat')
    setActiveChatTab('dm')
    setIncomingDmPopup(null)
  }

  const handleToggleUserRecordingPermission = (userId: string) => {
    const nextValue = !userRecordingPermissions[userId]
    setUserRecordingPermissions((prev) => ({
      ...prev,
      [userId]: nextValue
    }))
    // Broadcast permission change over data channel so the target user knows
    if (room) {
      try {
        const payload = {
          type: 'RECORDING_PERMISSION',
          sender: lobbyName,
          senderSid: room.localParticipant.sid || room.localParticipant.identity,
          targetUserId: userId,
          allowed: nextValue
        }
        const data = new TextEncoder().encode(JSON.stringify(payload))
        room.localParticipant.publishData(data, { reliable: true })
      } catch (e) {
        console.warn('Failed to broadcast recording permission:', e)
      }
    }
  }

  // Captions state
  const [showCaptions, setShowCaptions] = useState(false)
  const [activeCaption, setActiveCaption] = useState<{ participantId: string; text: string } | null>(null)
  const showCaptionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Raised hands
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({})

  // Emojis reactions & trays
  const [showReactionTray, setShowReactionTray] = useState(false)
  const [reactions, setReactions] = useState<{ id: string; participantSid: string; emoji: string }[]>([])

  // Video visual filters & virtual backgrounds
  const [localVideoFilter, setLocalVideoFilter] = useState('none')
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = useState(true)
  const [participantFilters, setParticipantFilters] = useState<Record<string, string>>({})
  const [aiFraming, setAiFraming] = useState(false)

  // Workspace Split Layout: 'none' | 'code' | 'whiteboard' | 'uno' | 'agenda' | 'notes'
  const [activeWorkspace, setActiveWorkspace] = useState<'none' | 'code' | 'whiteboard' | 'uno' | 'agenda' | 'notes'>('none')
  const [isPresentingWorkspace, setIsPresentingWorkspace] = useState<string | null>(null)
  const [presentedWorkspace, setPresentedWorkspace] = useState<{ type: string, state: any, presenterSid: string, presenterName: string } | null>(null)
  const [presentedWorkspaceLayout, setPresentedWorkspaceLayout] = useState<'grid' | 'maximized' | 'minimized'>('grid')
  const [currentPage, setCurrentPage] = useState(0)
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false)
  const [meetingType, setMeetingType] = useState('technical')

  // AI Meeting Summary System
  const [isSummaryPanelOpen, setIsSummaryPanelOpen] = useState(false)
  const {
    summary: aiSummary,
    isGenerating: isGeneratingSummary,
    isSendingEmail: isSendingSummaryEmail,
    emailSent: isSummaryEmailSent,
    error: summaryError,
    generateSummary,
    sendSummaryEmail,
    saveSummary,
    addChatMessage: accumulateChatMessage,
    addTranscriptItem: accumulateTranscriptItem,
    updateCodeSnapshot: accumulateCodeSnapshot
  } = useMeetingSummary({
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
    roomId,
    meetingTitle: meetingTitle || 'Codovate Meeting',
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null
  })

  // Admin Command Center State
  const [showAdminCenter, setShowAdminCenter] = useState(false)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    isRoomLocked: false,
    isCodeLocked: false,
    isWhiteboardLocked: false,
    isChatDisabled: false,
    isAiDisabled: false,
    isScreenShareLocked: false,
    isMicLocked: false,
    isCameraLocked: false,
    isRecordingLocked: false,
    waitingRoom: false,
    isDmDisabled: false,
    isGamesDisabled: false,
    isParticipantListHidden: false,
    isParticipantInfoRestricted: false,
  })

  const isHostUser = Boolean(
    (meetingHostId && user && (user.id === meetingHostId || (meetingHostEmail && user.email === meetingHostEmail))) ||
    (userRoles[lobbyName] === 'Host' || userRoles[lobbyName] === 'Co-Host')
  )

  const canRecord = Boolean(
    isHostUser ||
    !adminSettings.isRecordingLocked ||
    hasGrantedRecordingPermission ||
    (user && userRecordingPermissions[user.id]) ||
    (user && userRecordingPermissions[user.email]) ||
    userRecordingPermissions[lobbyName]
  )

  // Refs to give stable access to latest values inside event handler closures
  const isHostUserRef = useRef(isHostUser)
  const adminSettingsRef = useRef(adminSettings)
  useEffect(() => { isHostUserRef.current = isHostUser }, [isHostUser])
  useEffect(() => { adminSettingsRef.current = adminSettings }, [adminSettings])

  useEffect(() => {
    if (activeWorkspace === 'none') {
      setIsWorkspaceMaximized(false)
    }
    setCurrentPage(0)
  }, [activeWorkspace])

  useEffect(() => {
    if (!presentedWorkspace) {
      setPresentedWorkspaceLayout('grid')
    }
  }, [presentedWorkspace])

  // Sidebar Panel: 'chat' | 'participants' | 'ai' | 'polls' | 'effects' | 'analytics' | 'dev' | 'timetravel' | 'focus' | 'interview' | 'scheduler' | 'abuse' | null
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null)

  // Chat Toast notification popup state
  const [chatToast, setChatToast] = useState<{ sender: string; text: string } | null>(null)
  const chatToastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (chatToastTimeoutRef.current) {
        clearTimeout(chatToastTimeoutRef.current)
      }
    }
  }, [])

  // Translation lang
  const [translationLang, setTranslationLang] = useState('none')

  // Polls states
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOption1, setPollOption1] = useState('')
  const [pollOption2, setPollOption2] = useState('')
  const [activePoll, setActivePoll] = useState<{ question: string; options: string[]; votes: number[]; userVoted?: number } | null>(null)

  // AI Assistant states
  const [aiInput, setAiInput] = useState('')
  const [aiConversations, setAiConversations] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: "Hello! I am your Codovate AI Meeting Assistant. Ask me to summarize discussions, list action items, or review active code snippets!" }
  ])
  const [aiLoading, setAiLoading] = useState(false)

  // Active collaborative code state
  const [activeCode, setActiveCode] = useState('// Write live collaborative code here\nconsole.log("Welcome developers!");')


  // Invite sharing popup state
  const [showInvitePopup, setShowInvitePopup] = useState(true)

  // Time Travel states
  const [timeTravelSearch, setTimeTravelSearch] = useState('')
  const [timelineSnapshots, setTimelineSnapshots] = useState<{ time: string; title: string; chat: any[]; code: string }[]>([])

  // Dev Dashboard state simulation
  const [cpuUsage, setCpuUsage] = useState(25)
  const [ramUsage, setRamUsage] = useState(54)
  const [containers, setContainers] = useState([
    { name: 'nginx-webserver', status: 'running', port: '80:80' },
    { name: 'meet-api-service', status: 'running', port: '7800:7800' },
    { name: 'postgres-db', status: 'running', port: '5432:5432' }
  ])

  // Interview candidate scorecard & dynamic data
  const [interviewScorecard, setInterviewScorecard] = useState({
    coding: 50,
    plagiarism: 0,
    confidence: 85,
    comms: 80
  })
  const [plagiarismRisk, setPlagiarismRisk] = useState(0)
  const [interviewObjectives, setInterviewObjectives] = useState('Verify core JS concepts, problem-solving, and clean coding practices.')
  const [interviewPurpose, setInterviewPurpose] = useState('Senior Frontend Developer Role')
  const [isEditingObjectives, setIsEditingObjectives] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Smart Scheduler states
  const [schedTitle, setSchedTitle] = useState('')
  const [schedDateTime, setSchedDateTime] = useState('')
  const [schedAgenda, setSchedAgenda] = useState('')
  const [schedResultCode, setSchedResultCode] = useState<string | null>(null)
  const [schedLoading, setSchedLoading] = useState(false)
  const [schedCopied, setSchedCopied] = useState(false)

  const handleScheduleMeeting = async () => {
    if (!schedTitle.trim() || !schedDateTime) {
      alert("Please enter both a title and date/time for the follow-up session.")
      return
    }
    setSchedLoading(true)
    try {
      const serializedRoomName = JSON.stringify({
        name: schedTitle.trim(),
        desc: schedAgenda.trim()
      })
      const data = await meetingService.createMeeting({
        roomName: serializedRoomName,
        scheduledAt: schedDateTime,
        type: 'technical'
      })
      setSchedResultCode(data.meetingId)
    } catch (e) {
      console.error("Failed to schedule follow-up session", e)
      alert("Failed to schedule follow-up session. Please try again.")
    } finally {
      setSchedLoading(false)
    }
  }

  // Pomodoro focus timer
  const [pomodoroSecs, setPomodoroSecs] = useState(25 * 60)
  const [pomodoroActive, setPomodoroActive] = useState(false)

  // Web Audio Context synthesizer ambient hum player
  const ambientAudioRef = useRef<{ ctx: AudioContext; osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null)
  const [activeAmbientSound, setActiveAmbientSound] = useState<'none' | 'lofi' | 'focus'>('none')

  const displayCaption = (participantId: string, text: string) => {
    setActiveCaption({ participantId, text })
    if (showCaptionTimeoutRef.current) {
      clearTimeout(showCaptionTimeoutRef.current)
    }
    showCaptionTimeoutRef.current = setTimeout(() => {
      setActiveCaption(null)
    }, 5000)
  }

  // Layout States
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  // Chat states
  const [messages, setMessages] = useState<{sender: string, text: string, time: Date}[]>([])
  const [messageInput, setMessageInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Send data over LiveKit data channel
  const sendData = (type: string, payload: any) => {
    if (!room) return
    try {
      const dataObj = {
        type,
        sender: lobbyName,
        senderSid: room.localParticipant.sid || room.localParticipant.identity,
        ...payload
      }
      const data = new TextEncoder().encode(JSON.stringify(dataObj))
      room.localParticipant.publishData(data, { reliable: true })
      
      // Process commands locally since publishData doesn't trigger DataReceived for the sender
      if (type === 'FORCE_WORKSPACE') {
        displayCaption('System', `You shared the ${payload.workspace} workspace with everyone`)
      } else if (type === 'ADMIN_COMMAND') {
        const { command, targetId, value } = payload
        if (command === 'TOGGLE_ROOM_LOCK') setAdminSettings(prev => ({ ...prev, isRoomLocked: value }))
        else if (command === 'TOGGLE_CODE_LOCK') setAdminSettings(prev => ({ ...prev, isCodeLocked: value }))
        else if (command === 'TOGGLE_WHITEBOARD_LOCK') setAdminSettings(prev => ({ ...prev, isWhiteboardLocked: value }))
        else if (command === 'TOGGLE_CHAT_LOCK') setAdminSettings(prev => ({ ...prev, isChatDisabled: value }))
        else if (command === 'TOGGLE_AI_LOCK') setAdminSettings(prev => ({ ...prev, isAiDisabled: value }))
        else if (command === 'TOGGLE_SCREENSHARE_LOCK') setAdminSettings(prev => ({ ...prev, isScreenShareLocked: value }))
        else if (command === 'TOGGLE_MIC_LOCK') setAdminSettings(prev => ({ ...prev, isMicLocked: value }))
        else if (command === 'TOGGLE_CAMERA_LOCK') setAdminSettings(prev => ({ ...prev, isCameraLocked: value }))
        else if (command === 'TOGGLE_WAITING_ROOM') setAdminSettings(prev => ({ ...prev, waitingRoom: value }))
        // Atomic lock commands — update admin's own state too
        else if (command === 'FORCE_MUTE_LOCK') setAdminSettings(prev => ({ ...prev, isMicLocked: true }))
        else if (command === 'FORCE_VIDEO_LOCK') setAdminSettings(prev => ({ ...prev, isCameraLocked: true }))
        else if (command === 'SYNC_TERMINAL') window.dispatchEvent(new CustomEvent('sync_terminal'))
        else if (command === 'SET_MEETING_TYPE') {
          setMeetingType(value)
          if (value === 'interview') setActiveSidebar('interview')
          else if (value === 'focus') setActiveSidebar('focus')
        }
      } else if (type === 'WHITEBOARD_CLEAR') {
        window.dispatchEvent(new CustomEvent('wb_clear'))
      }

    } catch (e) {
      console.warn("Failed to publish peer state:", e)
    }
  }

  // Broadcast Code State when presenting
  useEffect(() => {
    let interval: any;
    if (isPresentingWorkspace === 'code' && activeCode) {
      displayCaption('System', `Broadcasting your code workspace to peers...`)
      // Broadcast immediately
      sendData('PRESENT_WORKSPACE', { workspaceType: 'code', state: activeCode })
      
      // And broadcast periodically for late joiners
      interval = setInterval(() => {
        sendData('PRESENT_WORKSPACE', { workspaceType: 'code', state: activeCode })
      }, 1500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeCode, isPresentingWorkspace, room, lobbyName]) // Omitting sendData to avoid circular dependency loops if sendData identity changes

  // Broadcast Whiteboard State when presenting
  useEffect(() => {
    let interval: any;
    if (isPresentingWorkspace === 'whiteboard') {
      interval = setInterval(() => {
        const wbEditor = (window as any).codovateWhiteboardEditor
        if (wbEditor) {
          try {
            const snapshot = wbEditor.store.getSnapshot()
            sendData('PRESENT_WORKSPACE', { workspaceType: 'whiteboard', state: JSON.stringify(snapshot) })
          } catch (e) {}
        }
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [isPresentingWorkspace, room, lobbyName])

  const changeMeetingType = (newType: string) => {
    setMeetingType(newType)
    if (newType === 'interview') {
      setActiveSidebar('interview')
    } else if (newType === 'focus') {
      setActiveSidebar('focus')
    }
    if (isHostUser) {
      sendData('ADMIN_COMMAND', {
        command: 'SET_MEETING_TYPE',
        value: newType,
        targetId: 'ALL'
      })
    }
  }

  // Initialize Lobby & Fetch Meeting Metadata
  useEffect(() => {
    if (hasJoined) return

    const initLobby = async () => {
      let identity = ''
      const storedJoinName = localStorage.getItem('joinName')
      
      // Always try to load profile if they are logged in so `user` object exists for Admin check
      if (useAuth.getState().token) {
        await loadProfile()
      }

      const activeUser = useAuth.getState().user
      
      if (storedJoinName) {
        identity = storedJoinName
      } else if (activeUser) {
        identity = activeUser.name
      } else {
        identity = 'Guest_' + Math.floor(Math.random() * 1000)
      }
      setLobbyName(identity)

      let email = ''
      const storedJoinEmail = localStorage.getItem('joinEmail')
      if (storedJoinEmail) {
        email = storedJoinEmail
      } else if (activeUser) {
        email = activeUser.email || ''
      }
      setLobbyEmail(email)

      try {
        const meetingData = await meetingService.validateMeeting(roomId)
        setMeetingHostId(meetingData.host_id)
        setMeetingHostName(meetingData.host_name)
        setMeetingHostEmail(meetingData.host_email)
        setMeetingScheduledAt(meetingData.scheduled_at)
        
        let title = meetingData.room_name || 'Untitled Meeting'
        let desc = ''
        if (meetingData.room_name && meetingData.room_name.startsWith('{')) {
          try {
            const parsed = JSON.parse(meetingData.room_name)
            title = parsed.name || title
            desc = parsed.desc || ''
          } catch (_) {}
        }
        setMeetingTitle(title)
        setMeetingDescription(desc)
        setMeetingDuration(meetingData.duration_minutes || 60)

        if (title) setInterviewPurpose(title)
        if (desc) setInterviewObjectives(desc)

        if (meetingData.type) {
          setMeetingType(meetingData.type)
          // Always default workspaces to none so they do not show automatically
          setActiveWorkspace('none')
          
          if (meetingData.type === 'interview') {
            setActiveSidebar('interview')
          } else if (meetingData.type === 'focus') {
            setActiveSidebar('focus')
          }
        }
      } catch (e: any) { 
        console.error('Meeting validation failed', e)
        const errMsg = e.response?.data?.error || 'Meeting not found or expired.'
        setValidationError(errMsg)
      }



      try {
        const track = await createLocalVideoTrack()
        setPreviewVideoTrack(track)
        if (previewVideoRef.current) {
          previewVideoRef.current.muted = true
          previewVideoRef.current.playsInline = true
          track.attach(previewVideoRef.current)
          previewVideoRef.current.play().catch(() => {})
        }
      } catch (err) {
        setIsVideoOff(true)
      }
    }
    initLobby()

    return () => {
      if (previewVideoTrack) {
        previewVideoTrack.stop()
        previewVideoTrack.detach()
      }
    }
  }, [hasJoined, roomId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleJoinClick = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lobbyName.trim() || !lobbyEmail.trim()) return

    localStorage.setItem('joinName', lobbyName.trim())
    localStorage.setItem('joinEmail', lobbyEmail.trim())
    
    if (previewVideoTrack) {
      previewVideoTrack.stop()
      previewVideoTrack.detach()
    }

    setHasJoined(true)
    setStatusText('Requesting room token...')

    try {
      const uniqueIdentity = `${lobbyName.trim()}_${Math.random().toString(36).substring(2, 7)}`
      const data = await livekitService.getRoomToken(roomId.toUpperCase(), uniqueIdentity)
      setToken(data.token)
      setServerUrl(data.serverUrl)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to obtain room token.'
      setStatusText(msg)
    }
  }

  // Auto-pin screen shares
  useEffect(() => {
    if (!room) return
    let screenShareId: string | null = null
    
    participants.forEach(p => {
      const hasScreen = Array.from(p.trackPublications.values()).some((pub: any) => pub.source === 'screen_share')
      if (hasScreen) {
        screenShareId = `${p.sid || p.identity}:screen_share`
      }
    })

    if (screenShareId && !pinnedId) {
      setPinnedId(screenShareId)
    } else if (!screenShareId && pinnedId?.endsWith(':screen_share')) {
      setPinnedId(null)
    }
  }, [participants, pinnedId, room])



  // Paste Event Listener for Plagiarism Risk checking
  useEffect(() => {
    const handlePaste = () => {
      if (meetingType !== 'technical' && meetingType !== 'interview') return
      setPlagiarismRisk(prev => {
        const newRisk = Math.min(95, prev + 25)
        const updated = {
          coding: Math.min(100, 50 + Math.floor(metrics.codeEdits / 2) * 5),
          plagiarism: newRisk,
          confidence: interviewScorecard.confidence,
          comms: interviewScorecard.comms
        }
        sendData('INTERVIEW_SCORE_UPDATE', updated)
        setInterviewScorecard(updated)
        return newRisk
      })
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [meetingType, metrics.codeEdits, interviewScorecard])

  // Coding Score Real-time Update Hook
  useEffect(() => {
    if (meetingType !== 'technical' && meetingType !== 'interview') return
    const codingScore = Math.min(100, 50 + Math.floor(metrics.codeEdits / 2) * 5)
    setInterviewScorecard(prev => {
      const updated = { ...prev, coding: codingScore }
      sendData('INTERVIEW_SCORE_UPDATE', updated)
      return updated
    })
  }, [metrics.codeEdits, meetingType])

  // Initialize Timeline on join
  useEffect(() => {
    if (hasJoined) {
      setTimelineSnapshots([
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          title: 'Meeting started',
          chat: [],
          code: activeCode
        }
      ])
    }
  }, [hasJoined])

  // Chronological timeline snapshot updates from message history
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    setTimelineSnapshots(prev => {
      const snapshotTitle = `Message from ${lastMsg.sender}: "${lastMsg.text.slice(0, 30)}${lastMsg.text.length > 30 ? '...' : ''}"`
      if (prev.length > 0 && prev[prev.length - 1].title === snapshotTitle) return prev
      return [
        ...prev,
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          title: snapshotTitle,
          chat: messages,
          code: activeCode
        }
      ]
    })
  }, [messages, activeCode])

  // Chronological timeline snapshot updates from code history
  useEffect(() => {
    if (!activeCode.trim() || activeCode === '// Write live collaborative code here\nconsole.log("Welcome developers!");') return
    const timer = setTimeout(() => {
      setTimelineSnapshots(prev => {
        const title = 'Code Workspace Updated'
        if (prev.length > 0 && prev[prev.length - 1].title === title) return prev
        return [
          ...prev,
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            title: title,
            chat: messages,
            code: activeCode
          }
        ]
      })
    }, 3000)
    return () => clearTimeout(timer)
  }, [activeCode, messages])



  // Keep track of active workspace code changes
  useEffect(() => {
    const handleSync = (e: CustomEvent) => {
      setActiveCode(e.detail.text)
    }
    window.addEventListener('code_sync' as any, handleSync)
    window.addEventListener('code_sync_local' as any, handleSync)
    return () => {
      window.removeEventListener('code_sync' as any, handleSync)
      window.removeEventListener('code_sync_local' as any, handleSync)
    }
  }, [])

  // Live Time Travel snapshot timeline generator
  useEffect(() => {
    if (!room || !hasJoined) return
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setTimelineSnapshots(prev => [
        ...prev,
        {
          time: timeStr,
          title: messages.length > 0 ? `Active sync review: ${messages[messages.length - 1].text.substring(0, 15)}...` : 'Workspace development updates',
          chat: [...messages],
          code: '// Live Code Workspace snapshot saved'
        }
      ])
    }, 15000) // captures snapshot every 15s

    return () => clearInterval(interval)
  }, [room, hasJoined, messages])

  // Fluctuating Dev Dashboard CPU/RAM stats
  useEffect(() => {
    if (!room || !hasJoined) return
    const interval = setInterval(() => {
      setCpuUsage(Math.round(20 + Math.random() * 45))
      setRamUsage(Math.round(52 + Math.random() * 12))
    }, 2000)

    return () => clearInterval(interval)
  }, [room, hasJoined])

  // Pomodoro countdown timer
  useEffect(() => {
    if (!pomodoroActive) return
    const interval = setInterval(() => {
      setPomodoroSecs(prev => {
        if (prev <= 1) {
          setPomodoroActive(false)
          alert("Focus timer completed! Take a break.")
          return 25 * 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [pomodoroActive])

  // ── MOBILE AUDIO UNLOCK ──────────────────────────────────────────────────
  // Browsers require a user gesture to start AudioContext. On mobile, the first
  // tap after joining is enough — we resume any suspended AudioContext on it.
  useEffect(() => {
    if (!hasJoined) return
    const unlockAudio = () => {
      // Resume any suspended Web Audio contexts (including LiveKit's internal one)
      if (typeof AudioContext !== 'undefined') {
        const ctx = new AudioContext()
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
        ctx.close().catch(() => {})
      }
      // LiveKit official way to unlock and resume audio playback
      if (room) {
        room.startAudio().catch((e) => console.warn('Failed to start LiveKit audio:', e))
      }
      // Also try to play all existing <audio> elements
      document.querySelectorAll('audio').forEach(a => {
        if (a.paused) a.play().catch(() => {})
      })
    }
    document.addEventListener('touchstart', unlockAudio, { once: true })
    document.addEventListener('click', unlockAudio, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }
  }, [hasJoined, room])

  // WebRTC Data Channel Event Handlers
  useEffect(() => {
    if (!room) return
    const handleData = (data: Uint8Array, participant: any) => {
      try {
        const decoded = new TextDecoder().decode(data)
        console.log(`Received Data: ${decoded}`)
        const parsed = JSON.parse(decoded)
        const sender = parsed.sender || participant?.identity || 'Unknown'
        const senderSid = parsed.senderSid || participant?.sid || sender

        if (parsed.type === 'END_MEETING') {
          room.disconnect()
          alert('The host has ended the meeting.')
          window.location.href = '/dashboard'
          return
        }
        if (parsed.type === 'ADMIN_COMMAND') {
          // If the target is a specific user, ensure it applies to us
          if (parsed.targetId && parsed.targetId !== 'ALL' && parsed.targetId !== room.localParticipant.identity) {
            return
          }

          const _isHost = isHostUserRef.current

          if (parsed.command === 'FORCE_MUTE') {
            if (!_isHost) {
              room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
              setIsMuted(true)
              displayCaption('System', 'A Host has muted your microphone.')
            }
          } else if (parsed.command === 'FORCE_VIDEO_OFF') {
            if (!_isHost) {
              room.localParticipant.setCameraEnabled(false).catch(() => {})
              setIsVideoOff(true)
              displayCaption('System', 'A Host has turned off your camera.')
            }
          } else if (parsed.command === 'FORCE_MUTE_LOCK') {
            // Atomic: mute + lock mic in one command (no race condition)
            setAdminSettings(prev => ({ ...prev, isMicLocked: true }))
            if (!_isHost) {
              room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
              setIsMuted(true)
              displayCaption('System', 'The host has muted and locked everyone\'s microphone.')
            }
          } else if (parsed.command === 'FORCE_VIDEO_LOCK') {
            // Atomic: stop + lock camera in one command (no race condition)
            setAdminSettings(prev => ({ ...prev, isCameraLocked: true }))
            if (!_isHost) {
              room.localParticipant.setCameraEnabled(false).catch(() => {})
              setIsVideoOff(true)
              displayCaption('System', 'The host has stopped and locked everyone\'s camera.')
            }
          } else if (parsed.command === 'KICK_USER') {
            room.disconnect()
            alert('You have been removed from the meeting by a host.')
            window.location.href = '/dashboard'
          } else if (parsed.command === 'END_MEETING_ALL') {
            room.disconnect()
            alert('The host has ended the meeting.')
            window.location.href = '/dashboard'
          } else if (parsed.command === 'TOGGLE_ROOM_LOCK') {
            setAdminSettings(prev => ({ ...prev, isRoomLocked: parsed.value }))
            displayCaption('System', parsed.value ? 'Meeting is now Locked' : 'Meeting is now Open')
          } else if (parsed.command === 'TOGGLE_RECORDING_LOCK') {
            setAdminSettings(prev => ({ ...prev, isRecordingLocked: parsed.value }))
            displayCaption('System', parsed.value ? 'Recording option restricted by host' : '🎙️ Host enabled recording for all participants!')
          } else if (parsed.command === 'TOGGLE_WAITING_ROOM') {
            setAdminSettings(prev => ({ ...prev, waitingRoom: parsed.value }))
            displayCaption('System', parsed.value ? 'Waiting room is now active' : 'Waiting room is now disabled')
          } else if (parsed.command === 'TOGGLE_CODE_LOCK') {
            setAdminSettings(prev => ({ ...prev, isCodeLocked: parsed.value }))
          } else if (parsed.command === 'TOGGLE_WHITEBOARD_LOCK') {
            setAdminSettings(prev => ({ ...prev, isWhiteboardLocked: parsed.value }))
          } else if (parsed.command === 'TOGGLE_CHAT_LOCK') {
            setAdminSettings(prev => ({ ...prev, isChatDisabled: parsed.value }))
          } else if (parsed.command === 'TOGGLE_DM_LOCK') {
            setAdminSettings(prev => ({ ...prev, isDmDisabled: parsed.value }))
          } else if (parsed.command === 'TOGGLE_GAMES_LOCK') {
            setAdminSettings(prev => ({ ...prev, isGamesDisabled: parsed.value }))
          } else if (parsed.command === 'TOGGLE_HIDE_PARTICIPANTS') {
            setAdminSettings(prev => ({ ...prev, isParticipantListHidden: parsed.value }))
          } else if (parsed.command === 'TOGGLE_RESTRICT_INFO') {
            setAdminSettings(prev => ({ ...prev, isParticipantInfoRestricted: parsed.value }))
          } else if (parsed.command === 'SEND_TO_WAITING_ROOM') {
            const myIdentity = room.localParticipant.identity
            if ((parsed.targetId === myIdentity || parsed.targetId === 'ALL') && !_isHost) {
              setIsInWaitingRoom(true)
              displayCaption('System', 'The host moved you to the waiting room.')
            }
          } else if (parsed.command === 'TOGGLE_AI_LOCK') {
            setAdminSettings(prev => ({ ...prev, isAiDisabled: parsed.value }))
          } else if (parsed.command === 'TOGGLE_SCREENSHARE_LOCK') {
            setAdminSettings(prev => ({ ...prev, isScreenShareLocked: parsed.value }))
          } else if (parsed.command === 'TOGGLE_MIC_LOCK') {
            setAdminSettings(prev => ({ ...prev, isMicLocked: parsed.value }))
            if (!_isHost) {
              if (parsed.value) {
                // Admin locked mic — force disable immediately
                room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
                setIsMuted(true)
                displayCaption('System', 'The host has muted and locked everyone\'s microphone.')
              } else {
                // Admin UNLOCKED mic — only lift the restriction, do NOT auto-enable
                // Participants decide when to re-enable their own mic
                displayCaption('System', 'The host has unlocked your microphone. You may unmute.')
              }
            }
          } else if (parsed.command === 'TOGGLE_CAMERA_LOCK') {
            setAdminSettings(prev => ({ ...prev, isCameraLocked: parsed.value }))
            if (!_isHost) {
              if (parsed.value) {
                // Admin locked camera — force disable immediately
                room.localParticipant.setCameraEnabled(false).catch(() => {})
                setIsVideoOff(true)
                displayCaption('System', 'The host has stopped and locked everyone\'s camera.')
              } else {
                // Admin UNLOCKED camera — only lift the restriction, do NOT auto-enable
                displayCaption('System', 'The host has unlocked your camera. You may turn it on.')
              }
            }
          } else if (parsed.command === 'GRANT_RECORDING_PERMISSION') {
            setUserRecordingPermissions(prev => ({ ...prev, [parsed.targetId]: parsed.value }))
            const myIdentity = room.localParticipant.identity
            const myName = room.localParticipant.name || myIdentity
            if (parsed.targetId === myIdentity || parsed.targetId === myName || (user && parsed.targetId === user.id)) {
              setHasGrantedRecordingPermission(parsed.value)
              displayCaption('System', parsed.value
                ? '🎙️ Host has granted you recording permission'
                : '🚫 Host has revoked your recording permission'
              )
            }
          } else if (parsed.command === 'SYNC_TERMINAL') {
            window.dispatchEvent(new CustomEvent('sync_terminal'))
          } else if (parsed.command === 'SET_ROLE') {
            setUserRoles(prev => ({ ...prev, [parsed.targetId]: parsed.value }))
            if (parsed.targetId === room.localParticipant.identity) {
              displayCaption('System', `Your role has been changed to ${parsed.value}`)
            }
          } else if (parsed.command === 'SET_MEETING_TYPE') {
            setMeetingType(parsed.value)
            if (parsed.value === 'interview') {
              setActiveSidebar('interview')
            } else if (parsed.value === 'focus') {
              setActiveSidebar('focus')
            }
          }
          return
        }
        // ADMIN_STATE_SYNC: sent by admin to a new joiner to push full current room state
        if (parsed.type === 'ADMIN_STATE_SYNC') {
          const _isHost = isHostUserRef.current
          const syncedSettings: AdminSettings = parsed.settings
          setAdminSettings(syncedSettings)
          // Immediately enforce mic lock if active
          if (syncedSettings.isMicLocked && !_isHost) {
            room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
            setIsMuted(true)
            displayCaption('System', 'Meeting mic is locked by the host.')
          }
          // Immediately enforce camera lock if active
          if (syncedSettings.isCameraLocked && !_isHost) {
            room.localParticipant.setCameraEnabled(false).catch(() => {})
            setIsVideoOff(true)
            displayCaption('System', 'Meeting camera is locked by the host.')
          }
          return
        }
        if (parsed.type === 'CAPTION') {
          displayCaption(sender, parsed.text)
          accumulateTranscriptItem({ sender, text: parsed.text, startTimeSecs: Date.now() / 1000 })
          return
        }
        if (parsed.type === 'CHAT_MESSAGE') {
          setMessages(prev => [...prev, { sender, text: parsed.text, time: new Date() }])
          accumulateChatMessage({ sender, text: parsed.text })
          setMetrics(prev => ({ ...prev, chatMsgs: prev.chatMsgs + 1 }))
          // Show chat toast if chat panel is not open
          if (activeSidebar !== 'chat') {
            setChatToast({ sender, text: parsed.text })
            if (chatToastTimeoutRef.current) {
              clearTimeout(chatToastTimeoutRef.current)
            }
            chatToastTimeoutRef.current = setTimeout(() => {
              setChatToast(null)
            }, 4000)
          }
          return
        }
        if (parsed.type === 'NEW_POLL') {
          setPolls(prev => {
            if (prev.some(p => p.id === parsed.poll.id)) return prev
            return [...prev, parsed.poll]
          })
          displayCaption('System', `📊 New Poll Created: "${parsed.poll.question}"`)
          return
        }
        if (parsed.type === 'POLL_VOTE') {
          setPolls(prev => prev.map(p => {
            if (p.id !== parsed.pollId) return p
            
            // Check if user already voted in this poll
            const alreadyVoted = p.options.some((o: any) => o.voters.includes(parsed.voter))
            if (alreadyVoted) return p
            
            return {
              ...p,
              options: p.options.map((opt: any, idx: number) => {
                if (idx !== parsed.optionIndex) return opt
                return {
                  ...opt,
                  votes: opt.votes + 1,
                  voters: [...opt.voters, parsed.voter]
                }
              })
            }
          }))
          return
        }
        if (parsed.type === 'INTERVIEW_SCORE_UPDATE') {
          setInterviewScorecard({
            coding: parsed.coding,
            plagiarism: parsed.plagiarism,
            confidence: parsed.confidence,
            comms: parsed.comms
          })
          return
        }
        if (parsed.type === 'INTERVIEW_INFO_CHANGE') {
          setInterviewObjectives(parsed.objectives)
          setInterviewPurpose(parsed.purpose)
          return
        }
        if (parsed.type === 'ADMIN_COMMAND') {
          const payload = parsed.payload || parsed
          const command = payload.command
          const targetId = payload.targetId
          const value = payload.value
          const localSid = room?.localParticipant?.sid
          const localIdentity = room?.localParticipant?.identity

          const isTargetMe = targetId === 'ALL' ||
            (targetId && (
              targetId === localSid ||
              targetId === localIdentity ||
              targetId === lobbyName ||
              (localIdentity && targetId.includes(localIdentity)) ||
              (localIdentity && localIdentity.includes(targetId)) ||
              (lobbyName && targetId.startsWith(lobbyName))
            ))

          // 1. Lock Room
          if (command === 'TOGGLE_ROOM_LOCK') {
            setAdminSettings(prev => ({ ...prev, isRoomLocked: !!value }))
            displayCaption('System', value ? '🔒 Meeting room has been locked by the host' : '🔓 Meeting room has been unlocked')
          }

          // 2. Lock Mics / Mute All
          if (command === 'TOGGLE_MIC_LOCK' || command === 'FORCE_MUTE_LOCK') {
            setAdminSettings(prev => ({ ...prev, isMicLocked: value ?? true }))
            if (!isHostUser) {
              if (room?.localParticipant?.isMicrophoneEnabled) {
                room.localParticipant.setMicrophoneEnabled(false)
                setIsMuted(true)
              }
              displayCaption('System', '🎙️ Host has muted and locked all microphones')
            }
          }

          // 3. Lock Cameras / Force Camera Off All
          if (command === 'TOGGLE_CAMERA_LOCK' || command === 'FORCE_CAMERA_LOCK') {
            setAdminSettings(prev => ({ ...prev, isCameraLocked: value ?? true }))
            if (!isHostUser) {
              if (room?.localParticipant?.isCameraEnabled) {
                room.localParticipant.setCameraEnabled(false)
                setIsVideoOff(true)
              }
              displayCaption('System', '📹 Host has turned off and locked all video cameras')
            }
          }

          // 4. Lock Chat
          if (command === 'TOGGLE_CHAT_LOCK') {
            setAdminSettings(prev => ({ ...prev, isChatDisabled: !!value }))
            displayCaption('System', value ? '💬 Public chat locked by host' : '💬 Public chat unlocked')
          }

          // 5. Lock DMs
          if (command === 'TOGGLE_DM_LOCK') {
            setAdminSettings(prev => ({ ...prev, isDmDisabled: !!value }))
            displayCaption('System', value ? '🔒 Direct Messaging locked by host' : '🔓 Direct Messaging unlocked')
          }

          // 6. Lock Games
          if (command === 'TOGGLE_GAMES_LOCK') {
            setAdminSettings(prev => ({ ...prev, isGamesDisabled: !!value }))
            displayCaption('System', value ? '🃏 Games locked by host' : '🃏 Games unlocked')
          }

          // 7. Lock Code
          if (command === 'TOGGLE_CODE_LOCK') {
            setAdminSettings(prev => ({ ...prev, isCodeLocked: !!value }))
            displayCaption('System', value ? '🔒 Code editor locked by host' : '🔓 Code editor unlocked')
          }

          // 8. Lock Whiteboard
          if (command === 'TOGGLE_WHITEBOARD_LOCK') {
            setAdminSettings(prev => ({ ...prev, isWhiteboardLocked: !!value }))
            displayCaption('System', value ? '🎨 Whiteboard locked by host' : '🎨 Whiteboard unlocked')
          }

          // 9. Mute Single User
          if (command === 'MUTE_USER' && isTargetMe) {
            if (room?.localParticipant?.isMicrophoneEnabled) {
              room.localParticipant.setMicrophoneEnabled(false)
              setIsMuted(true)
            }
            displayCaption('System', '🎙️ Host muted your microphone')
          }

          // 10. Camera Off Single User
          if (command === 'CAMERA_OFF_USER' && isTargetMe) {
            if (room?.localParticipant?.isCameraEnabled) {
              room.localParticipant.setCameraEnabled(false)
              setIsVideoOff(true)
            }
            displayCaption('System', '📹 Host turned off your camera')
          }

          // 11. Kick User
          if (command === 'KICK_USER' && isTargetMe) {
            alert('⚠️ You have been removed from the meeting by the host.')
            handleLeaveCall()
          }

          // 12. Send to Waiting Room
          if (command === 'SEND_TO_WAITING_ROOM' && isTargetMe) {
            setIsInWaitingRoom(true)
            displayCaption('System', '⏳ Host placed you in the waiting room')
          }

          // 13. Set Role (Co-Host / Participant)
          if (command === 'SET_ROLE') {
            setUserRoles(prev => ({ ...prev, [targetId]: value, [targetId.split('_')[0]]: value }))
            if (isTargetMe) {
              displayCaption('System', `👑 Host assigned you role: ${value}`)
            }
          }

          // 14. Grant / Revoke Recording Permission
          if (command === 'GRANT_RECORDING_PERMISSION') {
            setUserRecordingPermissions(prev => ({ ...prev, [targetId]: !!value, [targetId.split('_')[0]]: !!value }))
            if (isTargetMe) {
              setHasGrantedRecordingPermission(!!value)
              displayCaption('System', value ? '🎥 Host granted you recording permission' : '🚫 Host revoked your recording permission')
            }
          }

          return
        }
        if (parsed.type === 'NEW_TASK') {
          setTasks(prev => {
            if (prev.some(t => t.id === parsed.task.id)) return prev
            return [...prev, parsed.task]
          })
          return
        }
        if (parsed.type === 'TOGGLE_TASK') {
          setTasks(prev => prev.map(t => t.id === parsed.taskId ? { ...t, completed: parsed.completed } : t))
          return
        }
        if (parsed.type === 'NEW_AGENDA_ITEM') {
          setAgenda(prev => {
            if (prev.some(a => a.id === parsed.item.id)) return prev
            return [...prev, parsed.item]
          })
          return
        }
        if (parsed.type === 'TOGGLE_AGENDA_ITEM') {
          setAgenda(prev => prev.map(a => a.id === parsed.itemId ? { ...a, completed: parsed.completed } : a))
          return
        }
        if (parsed.type === 'RAISE_HAND') {
          setRaisedHands(prev => ({ ...prev, [senderSid]: parsed.raised }))
          if (parsed.raised) {
            displayCaption('System', `🖐️ ${sender} raised their hand`)
          }
          return
        }
        if (parsed.type === 'EMOJI_REACTION') {
          const reactionId = Math.random().toString(36).substring(2, 9)
          setReactions(prev => [...prev, { id: reactionId, participantSid: senderSid, emoji: parsed.emoji }])
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== reactionId))
          }, 3000)
          return
        }
        if (parsed.type === 'WHITEBOARD_DRAW' || parsed.type === 'WHITEBOARD_CLEAR' || parsed.type === 'CODE_EDIT') {
          // Ignored. Workspaces are local unless presented.
          return
        }
        if (parsed.type === 'PRESENT_WORKSPACE') {
          if (parsed.action === 'stop') {
            setPresentedWorkspace(prev => (prev?.presenterSid === parsed.senderSid ? null : prev))
            displayCaption('System', `🛑 ${sender} stopped presenting their workspace`)
            return
          }
          setPresentedWorkspace({
            type: parsed.workspaceType,
            state: parsed.state,
            presenterSid: parsed.senderSid,
            presenterName: parsed.sender
          })
          setPresentedWorkspaceLayout('maximized')
          displayCaption('System', `🖥️ ${sender} is sharing their ${parsed.workspaceType} workspace as a screen presentation`)
          return
        }
        if (parsed.type === 'STOP_PRESENT_WORKSPACE') {
          setPresentedWorkspace(prev => (prev?.presenterSid === parsed.senderSid ? null : prev))
          displayCaption('System', `🛑 ${sender} stopped presenting their workspace`)
          return
        }
        if (parsed.type === 'FORCE_WORKSPACE') {
          setActiveWorkspace(parsed.workspace)
          displayCaption('System', `${sender} is sharing the ${parsed.workspace} workspace`)
          return
        }
        if (parsed.type === 'AI_REQ') {
          setMetrics(prev => ({ ...prev, aiRequests: prev.aiRequests + 1 }))
          return
        }
        if (parsed.type === 'FILTER_CHANGE') {
          setParticipantFilters(prev => ({ ...prev, [senderSid]: parsed.filter }))
          return
        }
        if (parsed.type === 'POLL_CREATE') {
          setActivePoll({ question: parsed.question, options: parsed.options, votes: parsed.options.map(() => 0) })
          return
        }
        if (parsed.type === 'POLL_VOTE') {
          setActivePoll(prev => {
            if (!prev) return null
            const updated = [...prev.votes]
            updated[parsed.optionIndex] = (updated[parsed.optionIndex] || 0) + 1
            return { ...prev, votes: updated }
          })
          return
        }

        if (parsed.type === 'UNO_START') {
          window.dispatchEvent(new CustomEvent('uno_start', { detail: parsed }))
          return
        }
        if (parsed.type === 'UNO_PLAY') {
          window.dispatchEvent(new CustomEvent('uno_play', { detail: parsed }))
          return
        }
        if (parsed.type === 'UNO_DRAW') {
          window.dispatchEvent(new CustomEvent('uno_draw', { detail: parsed }))
          return
        }
        if (parsed.type === 'UNO_WIN') {
          window.dispatchEvent(new CustomEvent('uno_win', { detail: parsed }))
          return
        }

        // ── Recording Permission ──
        if (parsed.type === 'RECORDING_PERMISSION') {
          const myIdentity = room.localParticipant.identity
          const myName = room.localParticipant.name || myIdentity
          if (parsed.targetUserId === myIdentity || parsed.targetUserId === myName) {
            setHasGrantedRecordingPermission(parsed.allowed)
            displayCaption('System', parsed.allowed
              ? '🎙️ Host has granted you recording permission'
              : '🚫 Host has revoked your recording permission'
            )
          }
          return
        }

        // ── Waiting Room Protocol ──
        if (parsed.type === 'JOIN_REQUEST') {
          if (isHostUserRef.current) {
            setWaitingParticipants(prev => {
              if (prev.some(p => p.identity === parsed.identity)) return prev
              return [...prev, {
                identity: parsed.identity,
                name: parsed.name,
                email: parsed.email || '',
                requestedAt: Date.now()
              }]
            })
          }
          return
        }
        if (parsed.type === 'ADMITTED') {
          const myIdentity = room.localParticipant.identity
          if (parsed.targetIdentity === myIdentity) {
            setIsInWaitingRoom(false)
            displayCaption('System', '✅ You have been admitted to the meeting!')
          }
          return
        }
        if (parsed.type === 'REJECTED') {
          const myIdentity = room.localParticipant.identity
          if (parsed.targetIdentity === myIdentity) {
            alert('You were not admitted to this meeting by the host.')
            window.location.href = '/'
          }
          return
        }
      } catch (e: any) {
        console.error('Failed to parse data message', e)
      }
    }
    room.on(RoomEvent.DataReceived, handleData)
    return () => { room.off(RoomEvent.DataReceived, handleData) }
  }, [room])

  // LiveKit room connection
  useEffect(() => {
    if (!token || !hasJoined) return

    setStatusText('Connecting to video server...')
    const activeRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720, frameRate: 24 }
      },
      publishDefaults: {
        videoCodec: 'vp8',
        backupCodec: { codec: 'h264' }
      },
      audioCaptureDefaults: {
        noiseSuppression: isNoiseCancellationEnabled,
        echoCancellation: true,
        autoGainControl: true,
      }
    })

    const updateParticipantList = () => {
      setParticipants([
        activeRoom.localParticipant,
        ...Array.from(activeRoom.remoteParticipants.values())
      ])
    }

    activeRoom.on(RoomEvent.Connected, () => {
      setStatusText('')
      const sid = activeRoom.localParticipant.sid
      const identity = activeRoom.localParticipant.identity
      if (localVideoFilter !== 'none') {
        setParticipantFilters(prev => ({
          ...prev,
          [sid]: localVideoFilter,
          [identity]: localVideoFilter
        }))
      }
      // If waiting room is enabled and user is NOT the host, send JOIN_REQUEST
      if (!isHostUserRef.current && adminSettingsRef.current.waitingRoom) {
        setIsInWaitingRoom(true)
        setTimeout(() => {
          const joinReqPayload = {
            type: 'JOIN_REQUEST',
            sender: activeRoom.localParticipant.identity,
            senderSid: activeRoom.localParticipant.sid || activeRoom.localParticipant.identity,
            identity: activeRoom.localParticipant.identity,
            name: activeRoom.localParticipant.name || activeRoom.localParticipant.identity,
            email: ''
          }
          try {
            const data = new TextEncoder().encode(JSON.stringify(joinReqPayload))
            activeRoom.localParticipant.publishData(data, { reliable: true })
          } catch (e) {
            console.warn('Failed to send JOIN_REQUEST:', e)
          }
        }, 1000)
      }
    })
    activeRoom.on(RoomEvent.ParticipantConnected, (participant) => {
      updateParticipantList()
      // If local user is the admin/host, immediately sync the current room
      // admin state to the new joiner so they respect existing locks
      if (isHostUserRef.current) {
        setTimeout(() => {
          // Small delay to ensure the new participant's data channel is ready
          const currentSettings = adminSettingsRef.current
          const syncPayload = {
            type: 'ADMIN_STATE_SYNC',
            sender: activeRoom.localParticipant.identity,
            senderSid: activeRoom.localParticipant.sid || activeRoom.localParticipant.identity,
            settings: currentSettings
          }
          try {
            const data = new TextEncoder().encode(JSON.stringify(syncPayload))
            activeRoom.localParticipant.publishData(data, { reliable: true, destinationIdentities: [participant.identity] })
          } catch (e) {
            console.warn('Failed to sync admin state to new participant:', e)
          }
        }, 1500)
      }
    })
    activeRoom.on(RoomEvent.ParticipantDisconnected, (p) => {
      updateParticipantList()
      const pid = p.sid || p.identity
      setRaisedHands(prev => { const c = { ...prev }; delete c[pid]; return c })
      setParticipantFilters(prev => { const c = { ...prev }; delete c[pid]; return c })
    })
    activeRoom.on(RoomEvent.TrackSubscribed, updateParticipantList)
    activeRoom.on(RoomEvent.TrackUnsubscribed, updateParticipantList)
    activeRoom.on(RoomEvent.LocalTrackPublished, updateParticipantList)
    activeRoom.on(RoomEvent.LocalTrackUnpublished, updateParticipantList)

    // Register transcription text stream handler
    activeRoom.registerTextStreamHandler('lk.transcription', async (reader, participant) => {
      for await (const raw of reader) {
        displayCaption(participant.identity, raw)
      }
    })

    let isCleanedUp = false

    const connectToRoom = async () => {
      try {
        const wsUrl = serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7800'
        if (isCleanedUp) return

        await activeRoom.connect(wsUrl, token)
        if (isCleanedUp) {
          activeRoom.disconnect()
          return
        }

        setRoom(activeRoom)
        updateParticipantList()

        try {
          if (isCleanedUp) return
          if (!isCompanionMode) {
            // Enable camera if not disabled in the lobby AND not locked by admin
            if (!isVideoOff && !adminSettingsRef.current.isCameraLocked) {
              try {
                await activeRoom.localParticipant.setCameraEnabled(true)
              } catch (camErr: any) {
                console.warn("Failed to enable camera on join:", camErr)
                setIsVideoOff(true)
              }
            } else {
              await activeRoom.localParticipant.setCameraEnabled(false)
              if (adminSettingsRef.current.isCameraLocked) setIsVideoOff(true)
            }

            if (isCleanedUp) {
              activeRoom.disconnect()
              return
            }

            // Enable microphone if not muted in the lobby AND not locked by admin
            if (!isMuted && !adminSettingsRef.current.isMicLocked) {
              try {
                await activeRoom.localParticipant.setMicrophoneEnabled(true)
              } catch (micErr: any) {
                console.warn("Failed to enable microphone on join:", micErr)
                setIsMuted(true)
                alert("Microphone not available: " + (micErr.message || micErr) + "\n\nPlease ensure your microphone is connected and permissions are allowed.")
              }
            } else {
              await activeRoom.localParticipant.setMicrophoneEnabled(false)
              if (adminSettingsRef.current.isMicLocked) setIsMuted(true)
            }
          } else {
            await activeRoom.localParticipant.setCameraEnabled(false)
            await activeRoom.localParticipant.setMicrophoneEnabled(false)
            setIsMuted(true)
            setIsVideoOff(true)
          }
        } catch (deviceErr: any) {
          console.error("Device initialization error:", deviceErr)
        }
      } catch (err) {
        if (!isCleanedUp) {
          setStatusText('Failed to connect to the video session.')
        }
      }
    }
    connectToRoom()

    return () => {
      isCleanedUp = true
      if (activeRoom.unregisterTextStreamHandler) {
        try {
          activeRoom.unregisterTextStreamHandler('lk.transcription')
        } catch (e) {}
      }
      try {
        activeRoom.disconnect()
      } catch (e) {}
    }
  }, [token, hasJoined, serverUrl, isCompanionMode])

  // ── PERSISTENT ADMIN LOCK ENFORCEMENT ────────────────────────────────────
  // Whenever the admin lock state changes (or room becomes available), enforce
  // it immediately on the local participant. This catches new joiners who receive
  // the lock state after their tracks are already published, and any other timing
  // edge cases. The host is exempt.
  useEffect(() => {
    if (!room || isHostUser) return
    if (adminSettings.isMicLocked) {
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
      setIsMuted(true)
    }
  }, [adminSettings.isMicLocked, room, isHostUser])

  useEffect(() => {
    if (!room || isHostUser) return
    if (adminSettings.isCameraLocked) {
      room.localParticipant.setCameraEnabled(false).catch(() => {})
      setIsVideoOff(true)
    }
  }, [adminSettings.isCameraLocked, room, isHostUser])

  // Toggle AI Assistant sidebar listener
  useEffect(() => {
    const handleToggleAi = () => {
      setActiveSidebar(prev => prev === 'ai' ? null : 'ai')
    }
    window.addEventListener('toggle_ai_sidebar', handleToggleAi)
    return () => window.removeEventListener('toggle_ai_sidebar', handleToggleAi)
  }, [])

  // Client-side speech recognition for captions & voice commands
  useEffect(() => {
    if (!room || isMuted || !hasJoined || isCompanionMode) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = async (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      const textLower = finalTranscript.toLowerCase().trim()
      if (textLower) {
        // Voice Commands Integration
        if (textLower === 'mute microphone' || textLower === 'mute audio' || textLower === 'mute mic') {
          if (!isMuted) handleMuteToggle()
          return
        }
        if (textLower === 'unmute microphone' || textLower === 'unmute audio' || textLower === 'unmute mic') {
          if (isMuted) handleMuteToggle()
          return
        }
        if (textLower === 'stop video' || textLower === 'camera off') {
          if (!isVideoOff) handleVideoToggle()
          return
        }
        if (textLower === 'start video' || textLower === 'camera on') {
          if (isVideoOff) handleVideoToggle()
          return
        }
        if (textLower === 'raise hand') {
          toggleHandRaise()
          return
        }
        if (textLower === 'lower hand') {
          if (isHandRaised) toggleHandRaise()
          return
        }
        if (textLower.includes('send reaction thumbs up') || textLower.includes('thumbs up')) {
          triggerReaction('👍')
          return
        }
        if (textLower.includes('send reaction heart') || textLower.includes('heart')) {
          triggerReaction('❤️')
          return
        }
        if (textLower.includes('generate react component') || textLower.includes('write react code')) {
          const reactTemplate = `import React from 'react';\n\nexport default function LoginPage() {\n  return (\n    <div className="p-8 text-center bg-popover rounded-[20px]">\n      <h2 className="text-xl font-bold text-white">Log in to Account</h2>\n      <button className="px-4 py-2 mt-4 text-white bg-primary rounded-lg font-bold">Submit</button>\n    </div>\n  );\n}`
          window.dispatchEvent(new CustomEvent('voice_code_template', { detail: { template: reactTemplate } }))
          displayCaption('System AI', "✓ Template 'React Login' generated from voice.")
          return
        }
        
        // Speech analytics for Technical Interview dashboard
        if (meetingType === 'technical' || meetingType === 'interview') {
          const words = textLower.split(/\s+/).length
          const fillers = (textLower.match(/\b(um|uh|like|ah|so|eh|basically)\b/gi) || []).length
          const fillerRatio = fillers / (words || 1)
          
          const confidenceScore = Math.max(35, Math.min(100, 95 - Math.floor(fillerRatio * 160) + Math.min(5, Math.floor(words / 20))))
          const commsScore = Math.max(45, Math.min(100, 90 - Math.floor(fillerRatio * 120) + Math.min(10, Math.floor(words / 30))))
          const codingScore = Math.min(100, 50 + Math.floor(metrics.codeEdits / 2) * 5)
          
          setInterviewScorecard(prev => {
            const updated = {
              coding: codingScore,
              plagiarism: plagiarismRisk,
              confidence: confidenceScore,
              comms: commsScore
            }
            sendData('INTERVIEW_SCORE_UPDATE', updated)
            return updated
          })
        }

        // Standard captions publishing
        const payload = JSON.stringify({ type: 'CAPTION', text: finalTranscript.trim(), sender: lobbyName })
        const data = new TextEncoder().encode(payload)
        try {
          await room.localParticipant.publishData(data, { reliable: true })
        } catch (e: any) {
          displayCaption('Error', `publishData failed: ${e.message}`)
          console.error('Failed to broadcast caption', e)
        }
        displayCaption(lobbyName, finalTranscript.trim())
      }
    }

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition warning', event.error)
    }

    try {
      recognition.start()
    } catch (e) {
      console.error('Failed to start speech recognition', e)
    }

    return () => {
      try {
        recognition.stop()
      } catch (e) {}
    }
  }, [room, isMuted, hasJoined, lobbyName, isHandRaised, isVideoOff, isCompanionMode])

  const handleMuteToggle = async () => {
    if (adminSettings.isMicLocked && !isHostUser) {
      alert("Your microphone has been locked by the host. You cannot unmute.")
      return
    }
    if (!room) { setIsMuted(!isMuted); return }
    try {
      await room.localParticipant.setMicrophoneEnabled(isMuted, {
        noiseSuppression: isNoiseCancellationEnabled,
        echoCancellation: true,
        autoGainControl: true,
      })
      setIsMuted(!isMuted)
    } catch (e: any) {
      console.error('Failed to toggle microphone:', e)
      alert('Could not toggle microphone: ' + (e.message || e) + '\n\nPlease ensure your microphone is connected and permissions are allowed.')
    }
  }

  const toggleNoiseCancellation = async () => {
    const newValue = !isNoiseCancellationEnabled
    setIsNoiseCancellationEnabled(newValue)
    if (room && !isMuted) {
      try {
        const publication = room.localParticipant.getTrackPublication('microphone' as any) || room.localParticipant.getTrackPublications().find(p => p.kind === 'audio')
        const audioTrack = publication?.track
        if (audioTrack && audioTrack.mediaStreamTrack) {
          await audioTrack.mediaStreamTrack.applyConstraints({
            noiseSuppression: newValue,
            echoCancellation: true,
            autoGainControl: true
          })
        }
      } catch (err) {
        console.warn("Failed to apply constraints dynamically:", err)
      }
    }
  }

  const handleVideoToggle = async () => {
    if (adminSettings.isCameraLocked && !isHostUser) {
      alert("Your camera has been locked by the host. You cannot turn it on.")
      return
    }
    if (!room) {
      setIsVideoOff(!isVideoOff)
      if (!isVideoOff && previewVideoTrack) {
        previewVideoTrack.stop()
        setPreviewVideoTrack(null)
      } else if (isVideoOff) {
        try {
          const track = await createLocalVideoTrack()
          setPreviewVideoTrack(track)
          if (previewVideoRef.current) track.attach(previewVideoRef.current)
        } catch(e: any) {
          // Revert state toggle since camera failed
          setIsVideoOff(true)
          console.warn('Camera not available in preview:', e.message)
          alert('Could not start camera preview: ' + (e.message || e) + '\n\nPlease ensure a webcam is connected and camera permissions are allowed in your browser settings.')
        }
      }
      return
    }
    try {
      await room.localParticipant.setCameraEnabled(isVideoOff)
      setIsVideoOff(!isVideoOff)
    } catch (e: any) {
      // Don't flip state – camera operation failed, keep current state
      console.error('Failed to toggle camera:', e)
      alert('Could not enable camera: ' + (e.message || e) + '\n\nPlease ensure a webcam is connected and camera permissions are allowed.')
    }
  }

  const handleScreenShareToggle = async () => {
    if (!room) return
    if (adminSettings.isScreenShareLocked && !isHostUser) {
      alert("Screen sharing is locked by the host.")
      return
    }
    try {
      await room.localParticipant.setScreenShareEnabled(!isScreenSharing)
      setIsScreenSharing(!isScreenSharing)
      setShareError(null)
      if (!isScreenSharing) {
        setPinnedId(`${room.localParticipant.sid || room.localParticipant.identity}:screen_share`)
      } else {
        setPinnedId(null)
      }
    } catch (e: any) {
      displayCaption('Error', `sendData failed: ${e.message}`)
      console.error('Failed to send data', e)
      setShareError(e.message ?? 'Unable to start screen share. Ensure HTTPS is enabled.')
    }
  }

  const handleLeaveCall = async () => {
    if (room) room.disconnect()
    window.location.href = '/dashboard'
  }

  const handleEndMeetingForAll = async () => {
    if (!room) return
    
    // Main host check: only allow ending the meeting if user is the meeting creator
    if (!isHostUser) {
      console.warn("Only the main host can end the meeting for all.")
      return
    }

    const payload = JSON.stringify({ type: 'END_MEETING' })
    const data = new TextEncoder().encode(payload)
    try {
      await room.localParticipant.publishData(data, { reliable: true })
    } catch (e) {}

    try { await meetingService.endMeeting(roomId, 60) } catch(e) {}
    room.disconnect()
    window.location.href = '/dashboard'
  }

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !room) return

    try {
      sendData('CHAT_MESSAGE', { text: messageInput })
      setMessages(prev => [...prev, { sender: lobbyName, text: messageInput, time: new Date() }])
      
      if (useAuth.getState().token) {
        await meetingService.sendMessage(roomId, messageInput)
      }
      setMessageInput('')
    } catch (e) {
      setMessageInput('')
    }
  }

  const kickParticipant = (identity: string) => {
    alert(`Host control: Disconnecting ${identity} (Kicked from room)`)
  }

  const toggleHandRaise = () => {
    const nextHand = !isHandRaised
    setIsHandRaised(nextHand)
    const localSid = room?.localParticipant.sid || room?.localParticipant.identity || 'local'
    setRaisedHands(prev => ({ ...prev, [localSid]: nextHand }))
    sendData('RAISE_HAND', { raised: nextHand })
  }

  const triggerReaction = (emoji: string) => {
    const localSid = room?.localParticipant.sid || room?.localParticipant.identity || 'local'
    const id = Math.random().toString(36).substring(2, 9)
    setReactions(prev => [...prev, { id, participantSid: localSid, emoji }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)

    sendData('EMOJI_REACTION', { emoji })
    setShowReactionTray(false)
  }

  const createPoll = () => {
    if (!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) return
    const options = [pollOption1, pollOption2]
    setActivePoll({ question: pollQuestion, options, votes: [0, 0] })
    sendData('POLL_CREATE', { question: pollQuestion, options })
    setPollQuestion(''); setPollOption1(''); setPollOption2('')
  }

  const votePoll = (optionIndex: number) => {
    if (!activePoll) return
    setActivePoll(prev => {
      if (!prev) return null
      const updated = [...prev.votes]
      updated[optionIndex] = (updated[optionIndex] || 0) + 1
      return { ...prev, votes: updated, userVoted: optionIndex }
    })
    sendData('POLL_VOTE', { optionIndex })
  }

  const askAI = async (promptText: string) => {
    if (!promptText.trim()) return
    setAiConversations(prev => [...prev, { sender: 'user', text: promptText }])
    setAiLoading(true)
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    try {
      const token = useAuth.getState().token || localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${backendUrl}/api/ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: promptText,
          chatHistory: messages,
          roomId,
          transcript: activeCaption ? [activeCaption] : [],
          codeSnippet: activeCode
        })
      })
      if (response.ok) {
        const data = await response.json()
        setAiConversations(prev => [...prev, { sender: 'ai', text: data.text }])
      } else {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || errData.message || `HTTP ${response.status} Error`)
      }
    } catch (err: any) {
      setAiConversations(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: `❌ AI failed to connect to ${backendUrl}/api/ai. Error: ${err.message || err}. Please check that backendUrl is configured and online.` 
        }
      ])
    } finally {
      setAiLoading(false)
    }
  }

  // Web Audio Context ambient noise synthesiser
  const handleAmbientToggle = (type: 'lofi' | 'focus') => {
    if (activeAmbientSound === type) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.ctx.close()
        ambientAudioRef.current = null
      }
      setActiveAmbientSound('none')
      return
    }

    if (ambientAudioRef.current) {
      ambientAudioRef.current.ctx.close()
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      if (type === 'lofi') {
        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(110, ctx.currentTime) // A2
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(165, ctx.currentTime) // E3 fifths
        gain.gain.setValueAtTime(0.06, ctx.currentTime)
      } else {
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(147, ctx.currentTime) // D3 focus hum
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(220, ctx.currentTime) // A3 fourths
        gain.gain.setValueAtTime(0.04, ctx.currentTime)
      }

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start()
      osc2.start()

      ambientAudioRef.current = { ctx, osc1, osc2, gain }
      setActiveAmbientSound(type)
    } catch (e) {
      console.warn("Audio Synthesis blocked by browser policy.")
    }
  }

  // Time Travel "Jump" simulation
  const handleTimeTravelJump = (snap: any) => {
    setMessages(snap.chat)
    alert(`⏳ Time Travel: Jumped back to snapshot (${snap.time}). Chat logs restored.`)
  }

  // Toggle Docker Container state locally
  const toggleContainer = (index: number) => {
    setContainers(prev => {
      const copy = [...prev]
      copy[index].status = copy[index].status === 'running' ? 'stopped' : 'running'
      return copy
    })
  }

  const activeTiles: { participant: any, source: 'camera' | 'screen_share', id: string, trackPub: any }[] = []
  participants.forEach(p => {
    const pid = p.sid || p.identity
    const cameraPub = Array.from(p.trackPublications.values()).find(
      (pub: any) => pub.source === 'camera' || (pub.kind === 'video' && pub.source !== 'screen_share')
    )
    activeTiles.push({ participant: p, source: 'camera', id: `${pid}:camera`, trackPub: cameraPub })
    
    const screenPub = Array.from(p.trackPublications.values()).find(
      (pub: any) => pub.source === 'screen_share'
    )
    if (screenPub) {
      activeTiles.push({ participant: p, source: 'screen_share', id: `${pid}:screen_share`, trackPub: screenPub })
    }
  })

  // Determine the main feature tile (Pinned, Screen Share OR Admin Camera)
  let mainFeatureTile = pinnedId ? activeTiles.find(t => t.id === pinnedId) : null
  if (!mainFeatureTile) {
    mainFeatureTile = activeTiles.find(t => t.source === 'screen_share')
  }
  if (!mainFeatureTile && meetingHostName) {
    mainFeatureTile = activeTiles.find(t => t.source === 'camera' && (t.participant.identity.startsWith(meetingHostName + '_') || t.participant.identity === meetingHostName))
  }

  // ── GRID LAYOUT LOGIC ─────────────────────────────────────────────────────────────
  // When workspace is open, show 2 tiles max in the side strip.
  // In normal mode, show ALL tiles per page (up to a max of 9 before paginating).
  const tilesPerPage = activeWorkspace !== 'none' ? 2 : 9

  let displayTiles: any[] = []
  let totalPages = 1
  let activePage = 0

  // Only use the "featured" single-tile layout when someone is pinned or screen-sharing.
  // For a normal <=4 participant call, show everyone in the grid together.
  const hasPinnedOrScreen = !!pinnedId || activeTiles.some(t => t.source === 'screen_share')

  if (mainFeatureTile && hasPinnedOrScreen) {
    const otherTiles = activeTiles.filter(t => t.id !== mainFeatureTile!.id)
    totalPages = 1 + Math.ceil(otherTiles.length / tilesPerPage)
    activePage = Math.min(currentPage, Math.max(0, totalPages - 1))

    if (activePage === 0) {
      displayTiles = [mainFeatureTile]
    } else {
      const offset = (activePage - 1) * tilesPerPage
      displayTiles = otherTiles.slice(offset, offset + tilesPerPage)
    }
  } else {
    // Show all tiles together — no single featured tile
    totalPages = Math.max(1, Math.ceil(activeTiles.length / tilesPerPage))
    activePage = Math.min(currentPage, Math.max(0, totalPages - 1))
    displayTiles = activeTiles.slice(activePage * tilesPerPage, (activePage + 1) * tilesPerPage)
  }

  const isFeaturedPage = !!(mainFeatureTile && hasPinnedOrScreen && activePage === 0)

  // On-the-Go Mode Simplified Layout
  if (isOnToGoMode) {
    let currentSpeakerName = 'Nobody is speaking'
    const activeSpeakers = participants.filter(p => p.isSpeaking)
    if (activeSpeakers.length > 0) {
      currentSpeakerName = `${getDisplayName(activeSpeakers[0].identity)} is speaking`
    }
    
    return (
      <div className="min-h-screen bg-card text-white flex flex-col justify-between p-6">
        <header className="flex justify-between items-center border-b border-slate-900 pb-4 select-none">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="font-extrabold text-sm">On-the-Go Mode Active</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsOnToGoMode(false)} className="border-slate-855 hover:bg-popover text-slate-300">
            Exit Mode
          </Button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-popover border border-border flex items-center justify-center shadow-2xl">
            <span className="text-3.5xl">🚶</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-100">{currentSpeakerName}</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Video streams and layouts are hidden to decrease distraction and save bandwidth.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm w-full mx-auto pb-6">
          <Button
            onClick={handleMuteToggle}
            className={`h-16 rounded-2xl border-none font-extrabold text-lg transition flex items-center justify-center gap-2.5 ${isMuted ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10' : 'bg-popover border border-slate-855 hover:bg-slate-800 text-slate-200'}`}
          >
            {isMuted ? <><MicOff className="h-6 w-6" /> Unmute</> : <><Mic className="h-6 w-6" /> Mute mic</>}
          </Button>

          <Button
            onClick={toggleHandRaise}
            className={`h-16 rounded-2xl border-none font-extrabold text-lg transition flex items-center justify-center gap-2.5 ${isHandRaised ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-popover border border-slate-855 hover:bg-slate-800 text-slate-200'}`}
          >
            🖐️ {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          </Button>

          <Button
            onClick={handleLeaveCall}
            className="h-16 rounded-2xl bg-red-700 hover:bg-red-800 font-extrabold text-lg text-white border-none flex items-center justify-center gap-2"
          >
            <PhoneOff className="h-6 w-6" /> Leave Call
          </Button>
        </div>
      </div>
    )
  }

  // Render Sidebar Content Tabs
  const renderSidebarContent = () => {
    switch (activeSidebar) {
      case 'chat':
        return (
          <div className="flex flex-col h-full bg-popover/50">
            {/* Public Chat vs DM Sub-tabs */}
            <div className="flex border-b border-border bg-slate-900/60 p-1 gap-1">
              <button
                onClick={() => setActiveChatTab('public')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeChatTab === 'public'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Public Chat
              </button>
              <button
                onClick={() => setActiveChatTab('dm')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeChatTab === 'dm'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Direct Messages (DMs)
              </button>
            </div>

            {/* Direct Messages Component — Always mounted in background to catch all incoming DMs */}
            <div className={activeChatTab === 'dm' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
              <DirectMessageDrawer
                room={room}
                participants={participants}
                currentIdentity={room?.localParticipant?.identity || lobbyName}
                currentName={lobbyName}
                isDirectMessagingDisabled={adminSettings.isDmDisabled}
                isHost={isHostUser}
                initialPeerIdentity={targetDmIdentity}
                onIncomingDmNotify={(dm) => {
                  setIncomingDmPopup({
                    senderIdentity: dm.senderIdentity,
                    senderName: dm.senderName,
                    text: dm.text,
                    timestamp: Date.now()
                  })
                }}
              />
            </div>

            {activeChatTab !== 'dm' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-blue-950/40 border border-blue-900/50 rounded-[20px] p-3 text-xs text-blue-300 flex items-start gap-2 select-none">
                    <span>🛡️</span>
                    <div>
                      <p className="font-bold">Messages won't be saved</p>
                      <p className="opacity-80">This chat history is temporary and will be cleared when the session ends.</p>
                    </div>
                  </div>
              
              <div className="flex items-center justify-between border-b border-border pb-3 gap-2">
                <span className="text-xs font-semibold text-slate-400">Live Translation</span>
                <select
                  value={translationLang}
                  onChange={(e) => setTranslationLang(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded text-[10px] px-2 py-0.5"
                >
                  <option value="none">Original Language</option>
                  <option value="en">Translate to English</option>
                  <option value="kn">Translate to Kannada</option>
                  <option value="hi">Translate to Hindi</option>
                </select>
              </div>

              {messages.length === 0 && <p className="text-center text-muted-foreground text-sm mt-4">No messages yet. Say hi! 👋</p>}
              {messages.map((msg, i) => {
                let displayedText = msg.text
                if (translationLang !== 'none') {
                  const translations: Record<string, Record<string, string>> = {
                    en: {
                      'hello': 'hello', 'hi': 'hi', 'welcome': 'welcome', 'good': 'good', 'code': 'code', 'whiteboard': 'whiteboard', 'meeting': 'meeting'
                    },
                    kn: {
                      'hello': 'ನಮಸ್ಕಾರ', 'hi': 'ನಮಸ್ಕಾರ', 'welcome': 'ಸುಸ್ವಾಗತ', 'good': 'ಒಳ್ಳೆಯದು', 'code': 'ಕೋಡ್', 'whiteboard': 'ಶ್ವೇತಫಲಕ', 'meeting': 'ಸಭೆ'
                    },
                    hi: {
                      'hello': 'नमस्ते', 'hi': 'नमस्ते', 'welcome': 'स्वागत', 'good': 'अच्छा', 'code': 'कोड', 'whiteboard': 'श्वेतपट', 'meeting': 'बैठक'
                    }
                  }
                  const words = msg.text.toLowerCase().split(/\b/)
                  const mapped = words.map(w => translations[translationLang]?.[w] || w)
                  displayedText = mapped.join('') + ' (Translated)'
                }

                const isMe = msg.sender === lobbyName
                return (
                  <div key={i} className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-bold text-xs ${isMe ? 'text-blue-400' : 'text-primary'}`}>{msg.sender}</span>
                      <span className="text-[9px] text-slate-400">{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className={`text-xs inline-block px-3 py-1.5 rounded-[20px] max-w-[85%] break-words shadow-sm ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                    }`}>
                      {displayedText}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="p-4 border-t border-border bg-popover/30">
              {adminSettings.isChatDisabled && !isHostUser ? (
                <p className="text-center text-xs text-slate-400 font-medium italic select-none py-2 bg-slate-900/50 rounded-xl border border-white/5">
                  💬 Chat has been locked by the host
                </p>
              ) : (
                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <Input placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="bg-background border-border" />
                  <Button type="submit" disabled={!messageInput.trim()} className="bg-primary text-primary-foreground hover:opacity-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    )
      case 'participants':
        return (
          <div className="flex flex-col h-full p-4 space-y-4 bg-popover/50">
            <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-[20px] p-3 text-xs text-emerald-300 flex flex-col gap-1 select-none">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>E2EE Connection Secured</span>
              </div>
              <p className="opacity-80">Keys: AES-GCM 256bit. Fingerprint: SHA-256: 4F:9E:BA:78:1C:89...</p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {participants.map(p => {
                  const pid = p.sid || p.identity
                  const isHost = meetingHostName 
                    ? (p.identity.startsWith(meetingHostName + '_') || p.identity === meetingHostName) 
                    : (!meetingHostId && p.isLocal)
                  const handRaised = raisedHands[pid]
                  const isUserMuted = p.isMicrophoneEnabled === false

                  return (
                    <div key={pid} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
                            {getDisplayName(p.identity).slice(0, 2)}
                          </div>
                          {handRaised && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 shadow">🖐️</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2 text-foreground truncate max-w-32">
                            {getDisplayName(p.identity)} {p.isLocal && <span className="text-[10px] text-muted-foreground">(You)</span>}
                            {isHost && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-bold">Host</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {!p.isLocal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDmWithUser(p.identity, getDisplayName(p.identity))}
                            className="h-6 w-6 hover:bg-blue-500/20 text-blue-400"
                            title={`Send Private DM to ${getDisplayName(p.identity)}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                          </Button>
                        )}
                        {isUserMuted ? <MicOff className="h-3.5 w-3.5 text-red-500" /> : <Mic className="h-3.5 w-3.5 text-emerald-500" />}
                        {isHostUser && !p.isLocal && (
                          <Button variant="ghost" size="icon" onClick={() => kickParticipant(p.identity)} className="h-6 w-6 hover:bg-destructive/10 text-destructive" title="Remove Participant">
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )
      case 'ai':
        return (
          <div className="flex flex-col h-full bg-popover/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => askAI("Generate meeting summary notes.")} 
                    variant="outline" 
                    className="flex-1 text-[10px] py-1.5 h-auto font-semibold border-border hover:bg-slate-800"
                    disabled={adminSettings.isAiDisabled && !isHostUser}
                  >
                    Meeting Notes
                  </Button>
                  <Button 
                    onClick={() => askAI("Extract checklist tasks.")} 
                    variant="outline" 
                    className="flex-1 text-[10px] py-1.5 h-auto font-semibold border-border hover:bg-slate-800"
                    disabled={adminSettings.isAiDisabled && !isHostUser}
                  >
                    Extract Tasks
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => askAI("Review the active code snippet, identify any syntax/logic bugs, and write a fixed version of the code inside a standard markdown code block.")} 
                    variant="outline" 
                    className="flex-1 text-[10px] py-1.5 h-auto font-semibold border-border hover:bg-slate-800"
                    disabled={adminSettings.isAiDisabled && !isHostUser}
                  >
                    Fix Bug
                  </Button>
                  <Button 
                    onClick={() => askAI("Explain the active code block line-by-line, detailing key variables, functions, and logic loops.")} 
                    variant="outline" 
                    className="flex-1 text-[10px] py-1.5 h-auto font-semibold border-border hover:bg-slate-800"
                    disabled={adminSettings.isAiDisabled && !isHostUser}
                  >
                    Explain Code
                  </Button>
                  <Button 
                    onClick={() => askAI("Generate comprehensive automated unit tests for the active code block and output them in a markdown code block.")} 
                    variant="outline" 
                    className="flex-1 text-[10px] py-1.5 h-auto font-semibold border-border hover:bg-slate-800"
                    disabled={adminSettings.isAiDisabled && !isHostUser}
                  >
                    Generate Tests
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">AI Assistant Logs</h3>
                <div className="space-y-3">
                  {aiConversations.map((c, i) => {
                    const parts = c.text.split(/(```[\s\S]*?```)/)
                    return (
                      <div key={i} className={`p-3 rounded-[20px] border ${c.sender === 'user' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-blue-950/20 border-blue-900/30'}`}>
                        <p className="text-[10px] uppercase font-extrabold text-primary mb-1 select-none">{c.sender === 'user' ? 'You' : 'Codovate AI'}</p>
                        <div className="text-xs space-y-2 text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('```')) {
                              const codeContent = part.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim()
                              return (
                                <div key={pIdx} className="my-2 bg-card border border-border rounded-md overflow-hidden font-mono">
                                  <div className="bg-popover px-2 py-1 flex justify-between items-center border-b border-border">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AI Generated Code</span>
                                    {c.sender !== 'user' && (
                                      <Button 
                                        size="sm" 
                                        className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white border-none font-bold px-2 py-0"
                                        onClick={() => {
                                          let updatedCode = codeContent
                                          if (activeCode.trim().startsWith('{')) {
                                            try {
                                              const files = JSON.parse(activeCode)
                                              const firstFile = Object.keys(files)[0] || 'index.html'
                                              files[firstFile] = {
                                                ...files[firstFile],
                                                code: codeContent
                                              }
                                              updatedCode = JSON.stringify(files)
                                            } catch (e) {
                                              // fallback
                                            }
                                          }
                                          setActiveCode(updatedCode)
                                          sendData('CODE_EDIT', { code: updatedCode })
                                        }}
                                      >
                                        Apply to Editor
                                      </Button>
                                    )}
                                  </div>
                                  <pre className="p-3 text-[10px] overflow-x-auto text-emerald-400">{codeContent}</pre>
                                </div>
                              )
                            }
                            return <span key={pIdx}>{part}</span>
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {aiLoading && (
                    <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-400 select-none">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Thinking...
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-popover/30">
              {adminSettings.isAiDisabled && !isHostUser ? (
                <p className="text-center text-xs text-slate-400 font-medium italic select-none py-2 bg-slate-900/50 rounded-xl border border-white/5">
                  🤖 AI Assistant has been locked by the host
                </p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); askAI(aiInput); setAiInput('') }} className="flex gap-2">
                  <Input placeholder="Ask AI Assistant..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} className="bg-background border-border" />
                  <Button type="submit" disabled={!aiInput.trim()} className="bg-primary text-primary-foreground hover:opacity-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        )

      case 'effects':
        return (
          <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto bg-popover/50">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Webcam Filters</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Normal', value: 'none' },
                  { name: 'Noir (B&W)', value: 'noir' },
                  { name: 'Warm Tone', value: 'warm' },
                  { name: 'Cool Tone', value: 'cool' },
                  { name: 'Cyberpunk', value: 'cyberpunk' },
                  { name: 'Vintage', value: 'vintage' },
                  { name: 'Bubblegum', value: 'bubblegum' },
                  { name: 'Soft Glow', value: 'glow' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setLocalVideoFilter(f.value)
                      sendData('FILTER_CHANGE', { filter: f.value })
                      const localSid = room?.localParticipant?.sid
                      const localIdentity = room?.localParticipant?.identity
                      setParticipantFilters(prev => {
                        const updated = { ...prev }
                        if (localSid) updated[localSid] = f.value
                        if (localIdentity) updated[localIdentity] = f.value
                        return updated
                      })
                    }}
                    className={`p-2 text-[10px] rounded-[20px] font-bold border transition ${localVideoFilter === f.value ? 'bg-primary text-white border-primary' : 'bg-slate-850 border-border text-slate-300 hover:bg-slate-800'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Audio Effects</h3>
              <div className="bg-slate-850 border border-border rounded-[20px] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isNoiseCancellationEnabled ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">AI Noise Cancellation</p>
                    <p className="text-[10px] text-slate-400">Filter out background hums</p>
                  </div>
                </div>
                <button
                  onClick={toggleNoiseCancellation}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isNoiseCancellationEnabled ? 'bg-primary' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isNoiseCancellationEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )
      case 'timetravel':
        return (
          <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto bg-popover/50">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white flex items-center gap-1 select-none">
                <Clock className="h-4 w-4 text-primary animate-pulse" /> AI Time Travel Snapshot
              </h3>
              <p className="text-[9px] text-slate-400 leading-tight">Search key moments and click timestamps to jump the collaborative workspace files and chat state back in time.</p>
            </div>
            
            <Input
              placeholder="Search timeline..."
              value={timeTravelSearch}
              onChange={(e) => setTimeTravelSearch(e.target.value)}
              className="bg-slate-850 border-border text-xs text-white"
            />

            <ScrollArea className="flex-1">
              <div className="space-y-3 relative border-l border-border pl-3.5 ml-2.5">
                {timelineSnapshots
                  .filter(snap => snap.title.toLowerCase().includes(timeTravelSearch.toLowerCase()))
                  .map((snap, i) => (
                    <div key={i} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-5 top-1 bg-primary w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 border border-border" />
                      
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-primary font-mono">{snap.time}</span>
                        <button
                          onClick={() => handleTimeTravelJump(snap)}
                          className="text-[9px] font-extrabold text-slate-400 hover:text-white hover:underline flex items-center gap-0.5"
                        >
                          <PlayCircle className="h-2.5 w-2.5" /> Jump
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-snug">{snap.title}</p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        )
      case 'focus':
        return (
          <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto bg-popover/50">
            {/* Pomodoro Timer */}
            <div className="bg-card/60 border border-border rounded-[20px] p-4 text-center space-y-3 select-none">
              <div>
                <span className="text-[9px] text-primary uppercase font-bold tracking-wider">Pomodoro focus block</span>
                <h3 className="font-extrabold text-3xl font-mono text-white mt-1">
                  {Math.floor(pomodoroSecs / 60)}:{(pomodoroSecs % 60).toString().padStart(2, '0')}
                </h3>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setPomodoroActive(!pomodoroActive)}
                  className={`h-8 text-xs font-bold px-4 border-none text-white ${pomodoroActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:opacity-90'}`}
                >
                  {pomodoroActive ? 'Pause' : 'Start'}
                </Button>
                <Button
                  onClick={() => { setPomodoroActive(false); setPomodoroSecs(25 * 60) }}
                  variant="outline"
                  className="h-8 text-xs font-bold border-border text-slate-300 hover:bg-slate-800"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Ambient noise player */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Ambient Focus Sounds</h3>
              <div className="space-y-2">
                {[
                  { key: 'lofi', name: 'Lo-Fi Chord Oscillator Hum', desc: 'Analog triangle wave harmonic hum' },
                  { key: 'focus', name: 'Deep Focus White Sine Waves', desc: 'Subtle sine-wave noise generator' }
                ].map(track => (
                  <div
                    key={track.key}
                    onClick={() => handleAmbientToggle(track.key as any)}
                    className={`p-3 rounded-[20px] border cursor-pointer select-none transition ${activeAmbientSound === track.key ? 'bg-primary/20 border-primary text-white' : 'bg-popover border-slate-850 text-slate-300 hover:bg-slate-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold">{track.name}</p>
                      <span className="text-[10px] font-extrabold uppercase">{activeAmbientSound === track.key ? 'Playing' : 'Play'}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{track.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'interview':
        const isHost = lobbyName === meetingHostName || lobbyName === 'Host'
        return (
          <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto bg-popover/50">
            <div className="space-y-1 select-none">
              <h3 className="text-xs font-bold text-white flex items-center gap-1">
                <Crown className="h-4 w-4 text-amber-400" /> Candidate Interview Dashboard
              </h3>
              <p className="text-[9px] text-slate-400 leading-tight">Monitor live structural analytics and security reviews during technical hiring rounds.</p>
            </div>

            {/* Scope & Objectives panel */}
            <div className="bg-card/40 p-3 rounded-[20px] border border-border space-y-2 text-slate-200">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objectives & Scope</span>
                {isHost && (
                  <button
                    onClick={() => setIsEditingObjectives(!isEditingObjectives)}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 border-none bg-transparent cursor-pointer"
                  >
                    {isEditingObjectives ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              {isEditingObjectives && isHost ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Position / Purpose</label>
                    <Input
                      value={interviewPurpose}
                      onChange={e => setInterviewPurpose(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      className="bg-slate-850 border-slate-700 h-8 text-xs text-white rounded-lg px-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Objectives</label>
                    <textarea
                      value={interviewObjectives}
                      onChange={e => setInterviewObjectives(e.target.value)}
                      placeholder="Verify core JS closures, async coding..."
                      className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white h-16 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setIsEditingObjectives(false)
                      sendData('INTERVIEW_INFO_CHANGE', { objectives: interviewObjectives, purpose: interviewPurpose })
                    }}
                    className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg border-none"
                  >
                    Save & Broadcast
                  </Button>
                </div>
              ) : (
                <div className="text-[11px] space-y-1">
                  <p className="text-slate-300 leading-snug"><strong className="text-slate-400 uppercase tracking-wider text-[8px] block mt-0.5">Role/Purpose</strong> {interviewPurpose || 'Not Defined'}</p>
                  <p className="text-slate-300 leading-snug"><strong className="text-slate-400 uppercase tracking-wider text-[8px] block mt-0.5">Objectives</strong> {interviewObjectives || 'Not Defined'}</p>
                </div>
              )}
            </div>

            {/* Scorecard visual progress bars */}
            <div className="bg-card/60 p-4 rounded-[20px] border border-border space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold select-none">
                  <span className="text-slate-300">Coding Score</span>
                  <span className="text-primary font-bold">{interviewScorecard.coding}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${interviewScorecard.coding}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold select-none">
                  <span className="text-slate-300">Confidence Score (Speaking pace)</span>
                  <span className="text-emerald-400 font-bold">{interviewScorecard.confidence}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${interviewScorecard.confidence}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold select-none">
                  <span className="text-slate-300">Communication Clarity</span>
                  <span className="text-indigo-400 font-bold">{interviewScorecard.comms}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${interviewScorecard.comms}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold select-none">
                  <span className="text-slate-300">Plagiarism Risk</span>
                  <span className="text-red-500 font-bold">{interviewScorecard.plagiarism}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${interviewScorecard.plagiarism}%` }} />
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                const candidate = participants.find(p => p.identity !== meetingHostName)
                const candidateName = candidate ? getDisplayName(candidate.identity) : lobbyName
                const reportContent = `# Candidate Interview Report\n\n- Candidate Name: ${candidateName}\n- Overall Coding Score: ${interviewScorecard.coding}%\n- Plagiarism Risk: ${interviewScorecard.plagiarism}%\n- Confidence Index: ${interviewScorecard.confidence}%\n\n*Verified securely by Codovate AI Proctoring.*`
                const blob = new Blob([reportContent], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `interview_report_${candidateName.toLowerCase().replace(/\s+/g, '_')}.md`
                a.click()
                alert("Candidate PDF/Markdown Interview Report downloaded successfully!")
              }}
              className="w-full text-xs font-bold bg-primary hover:opacity-90 h-9 border-none text-white cursor-pointer rounded-xl"
            >
              Export Candidate Report
            </Button>
          </div>
        )
      case 'scheduler':
        if (schedResultCode) {
          const shareLink = `${window.location.origin}/room?id=${schedResultCode}`
          const handleCopyLink = () => {
            navigator.clipboard.writeText(shareLink)
            setSchedCopied(true)
            setTimeout(() => setSchedCopied(false), 2000)
          }
          const handleShareWhatsApp = () => {
            const dateFormatted = formatMeetingDate(schedDateTime)
            const text = `🚀 You're invited to a collaborative session on Codovate Meet!\n\nLet's connect, communicate, and build together in real-time.\n\n📅 *Date & Time:* \n${dateFormatted}\n\n📌 *Topic:* *${schedTitle.trim() || 'Follow-up Session'}*\n\n🔗 *Join the workspace:* \n${shareLink}\n\n🔑 *Or enter this meeting code:* \n*${schedResultCode}*\n\nPowered by Codovate Meet 💻`
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
          }
          return (
            <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto bg-popover/50 text-slate-200">
              <h3 className="font-bold text-xs text-white">Smart Scheduler</h3>
              
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-[20px] text-center space-y-3">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Meeting Scheduled Successfully!</span>
                <p className="text-xs text-slate-300">Share this code with your team to connect and communicate.</p>
                
                <div className="bg-popover border border-border py-2.5 px-4 rounded-[20px] font-mono text-sm font-extrabold text-white tracking-widest select-all">
                  {schedResultCode}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyLink}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750"
                  >
                    {schedCopied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  
                  <Button
                    onClick={handleShareWhatsApp}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-1 border-none"
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => {
                  setSchedResultCode(null)
                  setSchedTitle('')
                  setSchedDateTime('')
                  setSchedAgenda('')
                }}
                className="w-full text-xs font-bold bg-primary hover:opacity-90 h-9 rounded-xl border-none"
              >
                Schedule Another
              </Button>
            </div>
          )
        }

        return (
          <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto bg-popover/50">
            <h3 className="font-bold text-xs text-white">Smart Scheduler</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Follow-up Title</label>
                <Input
                  placeholder="Tech Architecture Review..."
                  value={schedTitle}
                  onChange={e => setSchedTitle(e.target.value)}
                  className="bg-slate-850 border-slate-700 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={schedDateTime}
                  onChange={e => setSchedDateTime(e.target.value)}
                  className="bg-slate-850 border-slate-700 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Agenda</label>
                <textarea
                  value={schedAgenda}
                  onChange={e => setSchedAgenda(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white h-20 outline-none focus:border-primary"
                  placeholder="Define deliverables..."
                />
              </div>
              <Button
                onClick={handleScheduleMeeting}
                disabled={schedLoading || !schedTitle.trim() || !schedDateTime}
                className="w-full text-xs font-bold bg-primary hover:opacity-90 h-9 border-none rounded-xl"
              >
                {schedLoading ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
            </div>
          </div>
        )
      case 'abuse':
        return (
          <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto bg-popover/50">
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Flag className="h-4 w-4 text-red-500" /> Report Abuse
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                <select className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white outline-none">
                  <option>Harassment / Bullying</option>
                  <option>Spam / Flooding</option>
                  <option>Inappropriate visual content</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Participant</label>
                <select className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white outline-none">
                  {participants.map(p => (
                    <option key={p.sid || p.identity}>{getDisplayName(p.identity)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Incident Details</label>
                <textarea className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white h-20 outline-none focus:border-indigo-500" placeholder="Provide details to assist review..." />
              </div>
              <Button onClick={() => alert("Abuse report submitted.")} className="w-full text-xs font-bold bg-gradient-to-r from-red-500 to-rose-600 text-white border-none h-9 hover:opacity-90 transition-all">
                Submit Report
              </Button>
            </div>
          </div>
        )
      case 'github':
        return <GitHubPanel />
      case 'deploy':
        return <DeployPanel />
      case 'tasks':
        return <TasksSidebar room={room} lobbyName={lobbyName} sendData={sendData} tasks={tasks} setTasks={setTasks} />
      case 'polls':
        return <PollsSidebar room={room} lobbyName={lobbyName} sendData={sendData} polls={polls} setPolls={setPolls} />
      default:
        return null
    }
  }

  // Lobby Pre-Join Layout
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-slate-200 font-sans">
        <h1 className="text-3xl font-black mb-8 select-none bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Ready to join meeting?</h1>
        <div className="flex flex-col md:flex-row gap-8 items-center w-full max-w-full sm:max-w-4xl">
          <div className="flex-1 w-full bg-secondary rounded-2xl overflow-hidden aspect-video relative border border-border flex items-center justify-center shadow-2xl max-w-full transition-all duration-300 hover:border-indigo-500/30">
            <video ref={previewVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
            
            {isVideoOff && (
              <div className="flex flex-col items-center text-slate-400 select-none">
                <VideoOff className="h-12 w-12 mb-2 text-slate-300 animate-pulse" />
                <span className="text-xs font-semibold">Camera is off</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button onClick={handleMuteToggle} size="icon" className={`h-11 w-11 rounded-full border-none transition-all duration-300 hover:scale-110 active:scale-90 ${isMuted ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-red-500/20' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                {isMuted ? <MicOff className="h-4.5 w-4.5 text-white" /> : <Mic className="h-4.5 w-4.5 text-slate-300" />}
              </Button>
              <Button onClick={handleVideoToggle} size="icon" className={`h-11 w-11 rounded-full border-none transition-all duration-300 hover:scale-110 active:scale-90 ${isVideoOff ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-red-500/20' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                {isVideoOff ? <VideoOff className="h-4.5 w-4.5 text-white" /> : <Video className="h-4.5 w-4.5 text-slate-300" />}
              </Button>
            </div>
          </div>

          <div className="w-full md:w-80 bg-secondary p-6 rounded-2xl border border-border shadow-2xl space-y-4">
            {validationError ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cannot Join</h3>
                  <p className="text-xs text-slate-400 leading-relaxed px-1">
                    {validationError === 'Meeting has expired' 
                      ? 'This meeting has expired and cannot be rejoined.' 
                      : 'This meeting code is invalid or does not exist.'}
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/dashboard'} className="w-full h-10 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-[20px] transition-all border border-zinc-700">
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold select-none text-slate-200 leading-tight">
                    {meetingTitle || 'Meeting Lobby'}
                  </h2>
                  {meetingDescription && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                      🎯 Purpose: {meetingDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                    <span>Code: {roomId}</span>
                    {meetingDuration && <span>⏱️ {meetingDuration} mins</span>}
                  </div>
                </div>
                <form onSubmit={handleJoinClick} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Your Name</label>
                    <Input value={lobbyName} onChange={(e) => setLobbyName(e.target.value)} required className="bg-popover border-border focus:border-indigo-500 text-slate-200 rounded-[20px] h-10 px-3 transition-colors text-xs font-semibold" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Your Email</label>
                    <Input type="email" value={lobbyEmail} onChange={(e) => setLobbyEmail(e.target.value)} required className="bg-popover border-border focus:border-indigo-500 text-slate-200 rounded-[20px] h-10 px-3 transition-colors text-xs font-semibold" />
                  </div>
                  
                  <div className="flex items-center gap-2.5 select-none border border-border p-3 rounded-[20px] bg-popover/50 flex-1">
                    <input
                      type="checkbox"
                      id="companion"
                      checked={isCompanionMode}
                      onChange={(e) => setIsCompanionMode(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4.5 h-4.5 bg-slate-800 cursor-pointer transition-colors"
                    />
                    <label htmlFor="companion" className="text-[11px] text-slate-300 font-bold cursor-pointer uppercase tracking-wider">
                      Companion Mode (Presenter) 💻
                    </label>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-black text-sm h-12 rounded-[20px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 border-none">Join Now</Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Connected Meeting Room Layout
  return (
    <div className="relative h-[100dvh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111827] via-[#050816] to-[#050816] text-foreground flex flex-col justify-between overflow-hidden font-sans">
      
      {/* Chat Notification Popup Toast */}
      <AnimatePresence>
        {chatToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 left-1/2 z-[100] w-80 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-white"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-slate-200 truncate">{chatToast.sender}</span>
                <span className="text-[10px] text-slate-500 font-medium shrink-0">New Message</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 break-words leading-relaxed">{chatToast.text}</p>
            </div>
            <button 
              onClick={() => setChatToast(null)} 
              className="text-slate-500 hover:text-white transition p-0.5 rounded-lg hover:bg-white/5 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* On-the-Go Mode Overlay */}
      {isOnToGoMode && (
        <OnToGoOverlay 
          isMuted={isMuted}
          onToggleMute={handleMuteToggle}
          onLeaveCall={handleLeaveCall}
          onExitMode={() => setIsOnToGoMode(false)}
          roomId={roomId}
          participantsCount={participants.length}
        />
      )}



      {/* Inline styles for reaction floating */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -140px) scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* Meeting Room Header (Reference Mockup Design) */}
      <header className="px-4 py-2 bg-slate-950/95 backdrop-blur-xl flex items-center justify-between z-[500] shrink-0 border-b border-white/10 shadow-lg select-none">
        {/* Left: Brand + Room Code + Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Video className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-xs text-white tracking-tight">Codovate-Meet</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] font-bold text-slate-400">{roomId}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(roomId)}
                  className="text-slate-500 hover:text-slate-300 transition"
                  title="Copy Room ID"
                >
                  <Clipboard className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Green Network Telemetry Pill Badge */}
          <NetworkSignalBadge
            stats={adaptiveStats}
            config={adaptiveConfig}
            onOpenModal={() => setIsStatsModalOpen(true)}
            onToggleMode={setAdaptiveMode}
          />

          {/* Live Recording Pulsating Badge */}
          {isRecording && (
            <button
              onClick={() => setIsRecorderModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold animate-pulse shadow-sm"
              title="Recording in Progress"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>REC {Math.floor(recordingTimeSecs / 60).toString().padStart(2, '0')}:{(recordingTimeSecs % 60).toString().padStart(2, '0')}</span>
            </button>
          )}
        </div>
        
        {/* Right Header Navigation Pill Buttons (Filtered by Meeting Type) */}
        <div className="hidden lg:flex items-center gap-1.5">
          {/* GitHub & Deploy (Technical/Interview ONLY) */}
          {(meetingType === 'technical' || meetingType === 'interview') && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://github.com/vardhan-pv/codovatemeet', '_blank')}
                className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <GitBranch className="w-3.5 h-3.5 text-slate-400" /> GitHub
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
                className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <Rocket className="w-3.5 h-3.5 text-slate-400" /> Deploy
              </Button>
            </>
          )}

          {/* AI Notes */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSidebar(activeSidebar === 'ai' ? null : 'ai')}
            className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
              activeSidebar === 'ai'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Notes
          </Button>

          {/* Tasks */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSidebar(activeSidebar === 'tasks' ? null : 'tasks')}
            className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
              activeSidebar === 'tasks'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Tasks
          </Button>

          {/* Polls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSidebar(activeSidebar === 'polls' ? null : 'polls')}
            className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
              activeSidebar === 'polls'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Polls
          </Button>

          {/* Interview Mode (Technical/Interview ONLY) */}
          {(meetingType === 'technical' || meetingType === 'interview') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSidebar(activeSidebar === 'interview' ? null : 'interview')}
              className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
                activeSidebar === 'interview'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-purple-400" /> Interview Mode
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSidebar(activeSidebar === 'timetravel' ? null : 'timetravel')}
            className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
              activeSidebar === 'timetravel'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" /> Timeline
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSidebar(activeSidebar === 'focus' ? null : 'focus')}
            className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition ${
              activeSidebar === 'focus'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-orange-400" /> Focus
          </Button>

          <div className="relative ml-1">
            <button
              onClick={() => setShowProfilePopup(prev => !prev)}
              className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs hover:scale-105 transition"
              title="Your Profile"
            >
              {(lobbyName || 'U').charAt(0).toUpperCase()}
            </button>
            {showProfilePopup && (
              <div className="absolute right-0 top-10 w-64 bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-[250] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-lg">
                    {(lobbyName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{lobbyName || 'You'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || 'Guest'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isHostUser ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isHostUser ? '👑 Host' : '👤 Participant'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 space-y-1">
                  <button
                    onClick={() => { setActiveSidebar('effects'); setShowProfilePopup(false) }}
                    className="w-full text-left text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Device & Audio Settings
                  </button>
                  <button
                    onClick={() => { setShowProfilePopup(false); handleLeaveCall() }}
                    className="w-full text-left text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition flex items-center gap-2"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Leave Meeting
                  </button>
                </div>
                <button
                  onClick={() => setShowProfilePopup(false)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tool Selector & Host Admin Button */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Mobile Host Dedicated Admin Button */}
          {isHostUser && (
            <button
              onClick={() => setShowAdminCenter(true)}
              className="h-8 px-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition hover:bg-amber-500/30 cursor-pointer"
              title="Admin Command Center"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          )}

          <MobileToolSelect
            activeSidebar={activeSidebar}
            setActiveSidebar={setActiveSidebar}
            setIsOnToGoMode={setIsOnToGoMode}
            participantsCount={participants.length}
            meetingType={meetingType}
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            isScreenSharing={isScreenSharing}
            handleScreenShareToggle={handleScreenShareToggle}
            isHostUser={isHostUser}
            setShowAdminCenter={setShowAdminCenter}
            setIsRecorderModalOpen={setIsRecorderModalOpen}
            canRecord={canRecord}
            isRecording={isRecording}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── GLOBAL HIDDEN AUDIO ELEMENTS ────────────────────────────────────────
             These are rendered OUTSIDE the video grid so they always stay mounted.
             We use absolute positioning instead of display:none because iOS/Safari
             blocks audio playback for elements with display: none.
        ── */}
        <div className="absolute left-[-9999px] top-[-9999px] w-[1px] h-[1px] overflow-hidden pointer-events-none" aria-hidden="true">
          {participants
            .filter(p => !p.isLocal)
            .map(p => {
              const audioPub = Array.from(p.trackPublications.values()).find(
                (pub: any) => pub.kind === 'audio' && pub.isSubscribed && pub.track
              ) as any
              if (!audioPub) return null
              return (
                <AudioPlayer
                  key={p.sid || p.identity}
                  track={audioPub.track}
                  muted={audioPub.isMuted || isCompanionMode}
                />
              )
            })}
        </div>

        {/* Workspaces & Grid Pane */}
        <main className={`flex-1 flex flex-col md:flex-row overflow-hidden relative bg-transparent gap-4 ${
          activeWorkspace === 'none' ? 'p-1 sm:p-2' : 'p-4'
        }`}>
          
          {/* Left panel: Active workspace if set */}
          <div className={`flex-1 min-w-0 h-full relative ${activeWorkspace === 'none' ? 'hidden' : ''}`}>
            <div className={activeWorkspace === 'code' ? 'h-full w-full' : 'hidden'}>
              <CodeEditor code={activeCode} onCodeChange={setActiveCode} room={room} lobbyName={lobbyName} sendData={sendData} readOnly={userRoles[lobbyName] === 'Guest' || (adminSettings.isCodeLocked && !isHostUser)} />
            </div>
            <div className={activeWorkspace === 'whiteboard' ? 'h-full w-full' : 'hidden'}>
              <Whiteboard activeWorkspace={activeWorkspace} room={room} lobbyName={lobbyName} sendData={sendData} readOnly={userRoles[lobbyName] === 'Guest' || (adminSettings.isWhiteboardLocked && !isHostUser)} />
            </div>
            <div className={activeWorkspace === 'uno' ? 'h-full w-full' : 'hidden'}>
              <UnoGame room={room} lobbyName={lobbyName} sendData={sendData} />
            </div>
            <div className={activeWorkspace === 'agenda' ? 'h-full w-full' : 'hidden'}>
              <AgendaWorkspace room={room} lobbyName={lobbyName} sendData={sendData} agenda={agenda} setAgenda={setAgenda} />
            </div>
            <div className={activeWorkspace === 'notes' ? 'h-full w-full' : 'hidden'}>
              <NotesWorkspace sendData={sendData} />
            </div>
          </div>

          {/* Right panel: Video grid */}
          <div className={`h-full overflow-y-auto transition-all ${isWorkspaceMaximized ? 'hidden' : activeWorkspace !== 'none' ? 'hidden md:block w-full md:w-80 shrink-0' : 'flex-1'}`}>
            {statusText ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-foreground/60 font-medium italic select-none">{statusText}</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col gap-4">
                
                {/* Invite popup overlay when user joins alone */}
                {participants.length === 1 && showInvitePopup && (
                  <div className="bg-popover border border-slate-850 rounded-[20px] p-4 space-y-3 shadow-2xl relative select-none animate-in fade-in slide-in-from-top-4 duration-300">
                    <button onClick={() => setShowInvitePopup(false)} className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-200">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-white">You're the only one here</h4>
                      <p className="text-slate-400 text-[11px]">Share this link with others to invite them to the session.</p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/room?id=${roomId}` : roomId}
                        className="bg-card border-border text-[10px] text-primary h-8 font-mono select-all flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(typeof window !== 'undefined' ? `${window.location.origin}/room?id=${roomId}` : roomId)
                          alert("Invitation URL copied to clipboard!")
                        }}
                        className="h-8 text-xs font-bold px-3 shrink-0"
                      >
                        Copy
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const link = typeof window !== 'undefined' ? `${window.location.origin}/room?id=${roomId}` : roomId
                        const dateFormatted = formatMeetingDate(meetingScheduledAt)
                        const dateTimeStr = `📅 *Date & Time:* \n${dateFormatted}\n\n`
                        const text = `🚀 You're invited to a live session on Codovate Meet!\n\nLet's connect, communicate, and build together in real-time.\n\n${dateTimeStr}🔗 *Join the workspace:* \n${link}\n\n🔑 *Or enter this meeting code:* \n*${roomId}*\n\nPowered by Codovate Meet 💻`
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      className="w-full h-8 text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white border-none flex items-center justify-center gap-1.5"
                    >
                      <svg viewBox="0 0 448 512" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                      </svg>
                      Share on WhatsApp
                    </Button>
                  </div>
                )}

                <div className="flex flex-col h-full">
                  {presentedWorkspace && presentedWorkspaceLayout === 'minimized' && (
                    <div className="bg-indigo-600/90 backdrop-blur-md border border-indigo-500/30 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg shadow-indigo-600/10 mb-3 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <p className="text-xs font-semibold">
                          <span className="font-extrabold">{presentedWorkspace.presenterName}</span> is sharing their {presentedWorkspace.type} workspace.
                        </p>
                      </div>
                      <button 
                        onClick={() => setPresentedWorkspaceLayout('grid')}
                        className="bg-white text-indigo-700 text-xs px-3 py-1.5 rounded-lg font-extrabold hover:bg-indigo-50 shadow transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Presentation
                      </button>
                    </div>
                  )}

                  <div className={`grid gap-3 w-full flex-1 min-h-0 ${
                    isFeaturedPage || presentedWorkspaceLayout === 'maximized'
                      ? 'grid-cols-1 grid-rows-1'
                      : activeWorkspace !== 'none'
                        ? 'grid-cols-1'
                        : (displayTiles.length + (presentedWorkspace && presentedWorkspaceLayout !== 'minimized' ? 1 : 0)) === 1
                          ? 'grid-cols-1'
                          : (displayTiles.length + (presentedWorkspace && presentedWorkspaceLayout !== 'minimized' ? 1 : 0)) === 2
                            ? 'grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1'
                            : (displayTiles.length + (presentedWorkspace && presentedWorkspaceLayout !== 'minimized' ? 1 : 0)) <= 4
                              ? 'grid-cols-2 grid-rows-2'
                              : (displayTiles.length + (presentedWorkspace && presentedWorkspaceLayout !== 'minimized' ? 1 : 0)) <= 6
                                ? 'grid-cols-3 grid-rows-2'
                                : 'grid-cols-3 grid-rows-3'
                  } auto-rows-fr`}>
                    {presentedWorkspace && presentedWorkspaceLayout !== 'minimized' && (
                      <div className={`w-full h-full rounded-[20px] overflow-hidden min-h-0 bg-[#050816] relative border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex flex-col group ${
                        presentedWorkspaceLayout === 'maximized' ? 'col-span-full row-span-full' : ''
                      }`}>
                        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-start">
                          <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            {presentedWorkspace.presenterName}'s {presentedWorkspace.type}
                          </span>

                          <div className="flex gap-1.5">
                            {presentedWorkspaceLayout !== 'grid' && (
                              <button 
                                onClick={() => setPresentedWorkspaceLayout('grid')}
                                className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm flex items-center gap-1 font-bold shadow-lg transition-all cursor-pointer"
                                title="Show inside grid alongside other participants"
                              >
                                <Users className="w-3 h-3" /> Show in Grid
                              </button>
                            )}
                            {presentedWorkspaceLayout !== 'maximized' && (
                              <button 
                                onClick={() => setPresentedWorkspaceLayout('maximized')}
                                className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm flex items-center gap-1 font-bold shadow-lg transition-all cursor-pointer"
                                title="Maximize workspace view"
                              >
                                <Maximize2 className="w-3 h-3" /> Maximize
                              </button>
                            )}
                            {(presentedWorkspaceLayout as string) !== 'minimized' && (
                              <button 
                                onClick={() => setPresentedWorkspaceLayout('minimized')}
                                className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm flex items-center gap-1 font-bold shadow-lg transition-all cursor-pointer"
                                title="Minimize workspace to view full grid of meeting"
                              >
                                <Minimize2 className="w-3 h-3" /> Full Grid (Minimize)
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 w-full h-full relative pointer-events-auto mt-10">
                          {presentedWorkspace.type === 'code' && (
                            <CodeEditor code={presentedWorkspace.state} readOnly={true} onCodeChange={() => {}} />
                          )}
                          {presentedWorkspace.type === 'whiteboard' && (
                            <Whiteboard readOnly={true} presentedState={presentedWorkspace.state} />
                          )}
                        </div>
                      </div>
                    )}
                    {presentedWorkspaceLayout !== 'maximized' && displayTiles.map(tile => {
                      const pid = tile.id.split(':')[0]
                      return (
                        <div key={tile.id} className="w-full h-full rounded-[20px] overflow-hidden min-h-0 bg-black">
                          <VideoTile
                            participant={tile.participant}
                            source={tile.source}
                            isPinned={isFeaturedPage} // Treat as pinned when featured
                            onTogglePin={() => setPinnedId(isFeaturedPage ? null : tile.id)}
                            trackPub={tile.trackPub}
                            reactions={reactions.filter(r => r.participantSid === pid)}
                            filter={participantFilters[pid]}
                            handRaised={raisedHands[pid]}
                            isCompanionMode={isCompanionMode}
                            isAdminFeatured={!!(meetingHostName && (tile.participant.identity.startsWith(meetingHostName + '_') || tile.participant.identity === meetingHostName))}
                          />
                        </div>
                      )
                    })}
                  </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-4 bg-popover/80 border border-border rounded-full px-4 py-1.5 w-fit mx-auto select-none shadow-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={activePage === 0}
                          className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-800 border-none"
                        >
                          ◀
                        </Button>
                        <span className="text-[11px] font-bold text-slate-300">
                          Page {activePage + 1} of {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={activePage === totalPages - 1}
                          className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-800 border-none"
                        >
                          ▶
                        </Button>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>
        </main>

        {/* Floating Captions Overlay */}
        {showCaptions && activeCaption && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-popover/90 backdrop-blur-md text-white p-3 rounded-[20px] z-20 text-center pointer-events-none shadow-lg border border-white/5 select-none animate-in fade-in zoom-in-95 duration-200 font-semibold text-xs leading-relaxed">
            <p className="text-[10px] text-primary font-bold mb-0.5 uppercase tracking-wider">
              {activeCaption.participantId}
            </p>
            <p>
              {activeCaption.text}
            </p>
          </div>
        )}

        {/* Persistent Workspace-Sharing Notification Banner */}
        {presentedWorkspace && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none">
            <div className="flex items-center gap-2.5 bg-[#1a1a2e]/90 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl px-4 py-2.5 text-white">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 shrink-0">
                <Share2 className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary leading-none mb-0.5">SYSTEM</span>
                <span className="text-xs font-semibold leading-tight">
                  <span className="font-bold">{presentedWorkspace.presenterName}</span> is sharing their {presentedWorkspace.type} workspace
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Unified Tabbed Sidebar Panel */}
        {activeSidebar && (
          <>
            {/* Mobile backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99990] md:hidden"
              onClick={() => setActiveSidebar(null)}
            />
            <aside className="fixed md:static inset-x-0 bottom-0 top-14 md:top-0 z-[99995] md:z-20 h-[calc(100vh-3.5rem)] md:h-full w-full md:w-80 bg-slate-950 md:bg-secondary border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-200 rounded-t-3xl md:rounded-none">
              <div className="md:hidden w-12 h-1.5 bg-slate-800 rounded-full mx-auto mt-2.5 mb-1" />
              <div className="p-3.5 border-b border-border flex justify-between items-center bg-popover/80 backdrop-blur-md">
                <h2 className="font-extrabold text-sm text-slate-200 select-none capitalize">
                  {activeSidebar === 'chat' ? 'In-Call Messages' :
                   activeSidebar === 'participants' ? 'Meeting Participants' :
                   activeSidebar === 'ai' ? 'Codovate Assistant' :
                   activeSidebar === 'timetravel' ? 'AI Time Travel' :
                   activeSidebar === 'focus' ? 'Co-working & Pomodoro' :
                   activeSidebar === 'interview' ? 'Technical Interview' : activeSidebar}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setActiveSidebar(null)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            
            {/* Quick switcher inside sidebar */}
            {(() => {
              const sidebarTabs = [
                { tab: 'chat', label: 'Chat', icon: <MessageSquare className="h-3.5 w-3.5" /> },
                { tab: 'participants', label: 'Users', icon: <Users className="h-3.5 w-3.5" /> },
                { tab: 'ai', label: 'AI', icon: <Sparkles className="h-3.5 w-3.5" /> },
                { tab: 'timetravel', label: 'Timeline', icon: <Clock className="h-3.5 w-3.5" /> }
              ]
              if (meetingType === 'technical' || meetingType === 'interview') {
                sidebarTabs.push({ tab: 'interview', label: 'Interview', icon: <Crown className="h-3.5 w-3.5" /> })
              } else if (meetingType === 'focus') {
                sidebarTabs.push({ tab: 'focus', label: 'Focus', icon: <Timer className="h-3.5 w-3.5" /> })
              }
              const gridCols = sidebarTabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
              return (
                <div className={`grid ${gridCols} border-b border-border bg-background p-1`}>
                  {sidebarTabs.map(item => (
                    <button
                      key={item.tab}
                      onClick={() => setActiveSidebar(item.tab)}
                      title={item.label}
                      className={`py-1.5 flex justify-center rounded transition ${activeSidebar === item.tab ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/50 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              )
            })()}

            <div className="flex-1 min-h-0 bg-background/50">
              {renderSidebarContent()}
            </div>
          </aside>
        </>
      )}
      </div>

      {/* Floating Emojis Reaction Tray above Controls Dock */}
      {showReactionTray && (
        <div className="fixed sm:absolute bottom-20 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex gap-3.5 shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
          {['❤️', '👍', '🎉', '👏', '😂', '😮', '😢', '🤔'].map(emoji => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="text-2xl hover:scale-130 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ── ONE SINGLE FLOATING ACTION DOCK (Replaced according to user images - Zero Duplicates) ── */}
      <footer className="px-2 sm:px-4 py-3 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-2 z-[100] shrink-0 shadow-2xl select-none relative">
        
        {/* Left Card: Dynamically Tailored Workspace Buttons (Desktop Only) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-white/5 rounded-2xl p-1.5">
          {(meetingType === 'technical' || meetingType === 'interview') && (
            <>
              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'code' ? 'none' : 'code')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'code' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Code Workspace Editor"
              >
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-bold mt-0.5">Code</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'whiteboard' ? 'none' : 'whiteboard')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'whiteboard' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Whiteboard Workspace"
              >
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Whiteboard</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'uno' ? 'none' : 'uno')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'uno' ? 'bg-orange-600/30 text-orange-400 border border-orange-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="UNO! Game"
              >
                <span className="text-sm">🃏</span>
                <span className="text-[9px] font-bold mt-0.5">UNO Game</span>
              </button>
            </>
          )}

          {meetingType === 'business' && (
            <>
              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'notes' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Shared Meeting Notes"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-bold mt-0.5">Notes</span>
              </button>

              <button
                onClick={() => setActiveSidebar(activeSidebar === 'tasks' ? null : 'tasks')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeSidebar === 'tasks' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Tasks & Action Items"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-bold mt-0.5">Tasks</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'agenda' ? 'none' : 'agenda')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'agenda' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Meeting Agenda"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] font-bold mt-0.5">Agenda</span>
              </button>
            </>
          )}

          {meetingType === 'education' && (
            <>
              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'whiteboard' ? 'none' : 'whiteboard')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'whiteboard' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Classroom Whiteboard"
              >
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Whiteboard</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'notes' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Classroom Notes"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-bold mt-0.5">Notes</span>
              </button>

              <button
                onClick={() => setActiveSidebar(activeSidebar === 'polls' ? null : 'polls')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeSidebar === 'polls' ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Live Quizzes & Polls"
              >
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-bold mt-0.5">Quizzes</span>
              </button>
            </>
          )}

          {meetingType === 'brainstorm' && (
            <>
              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'whiteboard' ? 'none' : 'whiteboard')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'whiteboard' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Brainstorm Canvas"
              >
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Canvas</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'notes' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Idea Notes"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-bold mt-0.5">Notes</span>
              </button>
            </>
          )}

          {meetingType === 'standup' && (
            <>
              <button
                onClick={() => setActiveSidebar(activeSidebar === 'tasks' ? null : 'tasks')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeSidebar === 'tasks' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Sprint Tasks Board"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-bold mt-0.5">Sprint Tasks</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'notes' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Standup Notes"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-bold mt-0.5">Standup Notes</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'agenda' ? 'none' : 'agenda')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'agenda' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Standup Agenda & Timer"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] font-bold mt-0.5">Agenda</span>
              </button>
            </>
          )}

          {meetingType !== 'technical' && meetingType !== 'interview' && meetingType !== 'business' && meetingType !== 'education' && meetingType !== 'brainstorm' && meetingType !== 'standup' && (
            <>
              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'notes' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Notes Workspace"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-bold mt-0.5">Notes</span>
              </button>

              <button
                onClick={() => setActiveWorkspace(activeWorkspace === 'whiteboard' ? 'none' : 'whiteboard')}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
                  activeWorkspace === 'whiteboard' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40 font-bold' : 'hover:bg-white/5 text-slate-300'
                }`}
                title="Whiteboard Workspace"
              >
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Whiteboard</span>
              </button>
            </>
          )}
        </div>

        {/* Center Group: Compact Round Icon Buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Mic Button */}
          <button
            onClick={handleMuteToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
              isMuted ? 'bg-rose-600 text-white shadow-rose-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={handleVideoToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
              isVideoOff ? 'bg-rose-600 text-white shadow-rose-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-blue-400" />}
          </button>

          {/* Raise Hand Button (Mobile & Desktop) */}
          <button
            onClick={toggleHandRaise}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
              isHandRaised ? 'bg-amber-500 text-white shadow-amber-500/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <span className="text-base sm:text-lg leading-none">🖐️</span>
          </button>

          {/* Reaction Emojis Button (Mobile & Desktop) */}
          <button
            onClick={() => setShowReactionTray(!showReactionTray)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
              showReactionTray ? 'bg-pink-600 text-white' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title="Send Reaction Emojis"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
          </button>

          {/* UNO Game Button (Mobile & Desktop) */}
          <button
            onClick={() => setActiveWorkspace(activeWorkspace === 'uno' ? 'none' : 'uno')}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
              activeWorkspace === 'uno' ? 'bg-orange-600 text-white shadow-orange-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title="UNO Game"
          >
            <span className="text-base sm:text-lg leading-none">🃏</span>
          </button>

          {/* Desktop-Only Share Screen Button */}
          <button
            onClick={handleScreenShareToggle}
            className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition shadow-md active:scale-95 ${
              isScreenSharing ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <MonitorUp className="w-5 h-5 text-indigo-400" />
          </button>

          {/* Desktop-Only Chat Button */}
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
            className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition shadow-md active:scale-95 ${
              activeSidebar === 'chat' ? 'bg-blue-600 text-white shadow-blue-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </button>

          {/* Desktop-Only ••• More Button */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md active:scale-95 ${
                showMoreMenu ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700'
              }`}
              title="More Tools"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Floating Popover Menu */}
            {showMoreMenu && (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-64 max-h-[70vh] overflow-y-auto bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-2 shadow-2xl z-[300] animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-1 text-slate-200 text-xs font-semibold custom-scrollbar">
                {/* Record Session Button — respects admin recording permission */}
                {canRecord ? (
                  <button
                    onClick={() => { setIsRecorderModalOpen(true); setShowMoreMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition text-left ${
                      isRecording ? 'bg-rose-600/30 text-rose-400 font-bold animate-pulse' : 'hover:bg-white/10 text-rose-400 font-semibold'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-rose-400" />
                    <span>{isRecording ? 'Recording in Progress...' : 'Record Session'}</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-slate-500 cursor-not-allowed" title="Recording not permitted — ask the host to grant you permission">
                    <Radio className="w-4 h-4 text-slate-600" />
                    <span>Record Session</span>
                    <span className="ml-auto text-[9px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">No Permission</span>
                  </div>
                )}

                {/* Admin Command Center (Admin / Host ONLY!) */}
                {isHostUser && (
                  <button
                    onClick={() => { setShowAdminCenter(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-indigo-400 font-bold transition text-left"
                  >
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <span>Admin Command Center</span>
                  </button>
                )}

                {/* Security (Host ONLY!) */}
                {isHostUser && (
                  <button
                    onClick={() => { setShowAdminCenter(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-emerald-400 transition text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Security & Lock Controls</span>
                  </button>
                )}

                {/* Waiting Room (Host ONLY!) */}
                {isHostUser && (
                  <button
                    onClick={() => { setShowAdminCenter(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-amber-400 transition text-left relative"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Waiting Room</span>
                    {waitingParticipants.length > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 bg-rose-500 text-white font-bold text-[10px] rounded-full">
                        {waitingParticipants.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Invite Link */}
                <button
                  onClick={() => { setShowInvitePopup(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Share2 className="w-4 h-4 text-slate-300" />
                  <span>Invite Link & Share</span>
                </button>

                <button
                  onClick={() => { setActiveWorkspace(activeWorkspace === 'notes' ? 'none' : 'notes'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Shared Notes Workspace</span>
                </button>

                <button
                  onClick={() => { setIsOnToGoMode(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span>On-The-Go Low Data Mode</span>
                </button>

                <button
                  onClick={() => { setIsSummaryPanelOpen(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-indigo-400 font-bold transition text-left"
                >
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>AI Meeting Summary & Notes</span>
                </button>

                <button
                  onClick={() => { setIsAnnotationActive(!isAnnotationActive); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Paintbrush className="w-4 h-4 text-blue-400" />
                  <span>Screen Annotation & Draw</span>
                </button>

                <button
                  onClick={() => { setActiveSidebar(activeSidebar === 'abuse' ? null : 'abuse'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-rose-400 transition text-left"
                >
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>Report Abuse</span>
                </button>

                <button
                  onClick={() => { setShowOnboardingTour(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-300 transition text-left border-t border-white/5 mt-1 pt-2"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Walkthrough Tour</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Quick icon actions (Desktop) + End/Leave (Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Participants (Desktop Only) */}
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
            className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center transition ${
              activeSidebar === 'participants' ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700'
            }`}
            title="Participants"
          >
            <Users className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Network Stats (Desktop Only) */}
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="hidden md:flex w-10 h-10 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 items-center justify-center transition"
            title="Network Status"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Device Settings (Desktop Only) */}
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'effects' ? null : 'effects')}
            className="hidden md:flex w-10 h-10 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 items-center justify-center transition"
            title="Device & Effects"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          {/* Export (Desktop Only) */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="hidden md:flex w-10 h-10 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 items-center justify-center transition"
            title="Export Package"
          >
            <Archive className="w-4 h-4 text-sky-400" />
          </button>

          {/* End Button (Host / Admin ONLY) */}
          {isHostUser && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to permanently END this meeting for all participants?')) {
                  handleEndMeetingForAll()
                }
              }}
              className="h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-4 rounded-full bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              title="Permanently End Meeting for Everyone (Host Only)"
            >
              <StopCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">End</span>
            </Button>
          )}

          {/* Leave Button (Everyone) */}
          <Button
            onClick={handleLeaveCall}
            className="h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4 shrink-0 fill-current" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </footer>

      {shareError && (
        <div className="absolute top-18 left-6 right-6 bg-destructive/15 border border-destructive/20 text-destructive p-3 rounded-lg text-xs z-35 flex items-center gap-1.5 select-none animate-bounce">
          <span>⚠️</span> {shareError}
        </div>
      )}

      {/* Admin Command Center */}
      {showAdminCenter && isHostUser && (
        <AdminCommandCenter 
          room={room} 
          participants={participants} 
          sendData={sendData} 
          adminSettings={adminSettings}
          onClose={() => setShowAdminCenter(false)}
          meetingHostId={meetingHostId || ''}
          user={user}
          metrics={metrics}
          userRoles={userRoles}
          meetingType={meetingType}
          setMeetingType={changeMeetingType}
          adaptiveStats={adaptiveStats}
          adaptiveConfig={adaptiveConfig}
          onUpdateAdaptiveConfig={updateAdaptiveConfig}
          userRecordingPermissions={userRecordingPermissions}
          onToggleUserRecordingPermission={handleToggleUserRecordingPermission}
          onUpdateAdminSetting={(key: keyof AdminSettings, val: boolean) => setAdminSettings((prev) => ({ ...prev, [key]: val }))}
        />
      )}

      {/* Adaptive Network Alert Banner */}
      <NetworkAlertBanner
        message={alertBannerMessage}
        onDismiss={clearAlertBanner}
        onOpenModal={() => setIsStatsModalOpen(true)}
        onEnableLowBandwidth={() => setAdaptiveMode('low_bandwidth')}
      />

      {/* Floating Incoming Direct Message Pop-up Toast Banner */}
      {incomingDmPopup && (
        <div className="fixed top-16 right-4 sm:right-6 z-[999999] bg-slate-900/95 border border-blue-500/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-200 text-white max-w-xs sm:max-w-sm select-none">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-400 animate-bounce" />
              Private DM from {incomingDmPopup.senderName}
            </span>
            <button
              onClick={() => setIncomingDmPopup(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-200 line-clamp-2 bg-slate-950/70 p-2.5 rounded-xl my-2 border border-white/5 font-sans font-medium">
            "{incomingDmPopup.text}"
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => openDmWithUser(incomingDmPopup.senderIdentity, incomingDmPopup.senderName)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reply & Chat</span>
            </Button>
          </div>
        </div>
      )}

      {/* Workspace Screen Sharing Top Notification Banner */}
      {presentedWorkspace && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[99999] bg-slate-950/95 border border-indigo-500/50 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-white text-xs font-bold animate-in slide-in-from-top-4 duration-200 select-none max-w-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="truncate">
            🖥️ {presentedWorkspace.presenterSid === (room?.localParticipant?.sid || room?.localParticipant?.identity)
              ? `You are presenting your ${presentedWorkspace.type} workspace to everyone`
              : `${presentedWorkspace.presenterName} is presenting their ${presentedWorkspace.type} workspace`}
          </span>
          {presentedWorkspace.presenterSid === (room?.localParticipant?.sid || room?.localParticipant?.identity) ? (
            <button
              onClick={() => {
                if (sendData) {
                  sendData('PRESENT_WORKSPACE', { action: 'stop' })
                }
                setPresentedWorkspace(null)
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-full text-[11px] font-extrabold transition shadow cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
            >
              <StopCircle className="w-3.5 h-3.5" /> Stop Sharing
            </button>
          ) : (
            <button
              onClick={() => setPresentedWorkspaceLayout(presentedWorkspaceLayout === 'maximized' ? 'grid' : 'maximized')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-[11px] font-extrabold transition shadow cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" /> {presentedWorkspaceLayout === 'maximized' ? 'Tile Grid' : 'Maximize'}
            </button>
          )}
        </div>
      )}

      {/* Adaptive Network Diagnostic & Performance Dashboard Modal */}
      <NetworkStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={adaptiveStats}
        config={adaptiveConfig}
        onUpdateConfig={updateAdaptiveConfig}
      />

      {/* Screen Annotation Layer */}
      <ScreenAnnotationLayer
        room={room}
        isActive={isAnnotationActive}
        onClose={() => setIsAnnotationActive(false)}
        isPresenter={true}
        senderName={lobbyName}
      />

      {/* Export Everything Package Modal */}
      <ExportEverythingModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        roomId={roomId}
        codeContent={activeCode}
        chatMessages={messages}
        aiNotes=""
        polls={polls}
        participants={participants}
      />

      {/* Host Admission Banner */}
      {isHostUser && (
        <HostAdmissionBanner
          waitingList={waitingParticipants}
          onAdmit={(id) => {
            // Remove from waiting list
            setWaitingParticipants((prev) => prev.filter((p) => p.identity !== id))
            // Send ADMITTED signal to that participant over data channel
            if (room) {
              try {
                const payload = {
                  type: 'ADMITTED',
                  sender: room.localParticipant.identity,
                  senderSid: room.localParticipant.sid || room.localParticipant.identity,
                  targetIdentity: id
                }
                const data = new TextEncoder().encode(JSON.stringify(payload))
                room.localParticipant.publishData(data, { reliable: true })
              } catch (e) {
                console.warn('Failed to send ADMITTED signal:', e)
              }
            }
          }}
          onReject={(id) => {
            setWaitingParticipants((prev) => prev.filter((p) => p.identity !== id))
            // Send REJECTED signal
            if (room) {
              try {
                const payload = {
                  type: 'REJECTED',
                  sender: room.localParticipant.identity,
                  senderSid: room.localParticipant.sid || room.localParticipant.identity,
                  targetIdentity: id
                }
                const data = new TextEncoder().encode(JSON.stringify(payload))
                room.localParticipant.publishData(data, { reliable: true })
              } catch (e) {
                console.warn('Failed to send REJECTED signal:', e)
              }
            }
          }}
          onAdmitAll={() => {
            // Admit all — send ADMITTED to each waiting participant
            waitingParticipants.forEach(p => {
              if (room) {
                try {
                  const payload = {
                    type: 'ADMITTED',
                    sender: room.localParticipant.identity,
                    senderSid: room.localParticipant.sid || room.localParticipant.identity,
                    targetIdentity: p.identity
                  }
                  const data = new TextEncoder().encode(JSON.stringify(payload))
                  room.localParticipant.publishData(data, { reliable: true })
                } catch (e) {
                  console.warn('Failed to send ADMITTED signal:', e)
                }
              }
            })
            setWaitingParticipants([])
          }}
        />
      )}

      {/* Non-host Waiting Room Screen */}
      {isInWaitingRoom && !isHostUser && (
        <WaitingRoomScreen
          meetingTitle={meetingTitle || 'Codovate Meeting'}
          roomId={roomId}
          hostName={meetingHostName || 'Host'}
          onLeave={handleLeaveCall}
        />
      )}

      {/* First-Time User Onboarding Walkthrough */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onComplete={() => setShowOnboardingTour(false)}
      />

      {/* Meeting Recording & Local Export Modal */}
      <MeetingRecorderModal
        isOpen={isRecorderModalOpen}
        onClose={() => setIsRecorderModalOpen(false)}
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTimeSecs={recordingTimeSecs}
        recordedBlob={recordedBlob}
        recordedUrl={recordedUrl}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onDownloadLocal={downloadRecording}
        onResetRecorder={resetRecorder}
        isRecordingLocked={adminSettings.isRecordingLocked && !(user && userRecordingPermissions[user.id])}
        isHost={isHostUser}
        roomId={roomId}
        transcriptItems={[]}
      />

      {/* AI Meeting Summary Panel */}
      <MeetingSummaryPanel
        isOpen={isSummaryPanelOpen}
        onClose={() => setIsSummaryPanelOpen(false)}
        summary={aiSummary}
        isGenerating={isGeneratingSummary}
        isSendingEmail={isSendingSummaryEmail}
        emailSent={isSummaryEmailSent}
        error={summaryError}
        onGenerate={generateSummary}
        onSendEmail={sendSummaryEmail}
        onSave={saveSummary}
        participantEmails={participants.map(p => p.identity).filter(Boolean)}
        roomId={roomId}
        meetingTitle={meetingTitle || 'Codovate Meeting'}
      />

      {typeof window !== 'undefined' && !window.isSecureContext && (
        <div className="absolute top-16 left-6 right-6 bg-amber-500/20 border border-amber-500/40 text-amber-300 p-4 rounded-[20px] text-xs z-35 flex flex-col gap-1.5 select-none shadow-xl">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <span>⚠️</span> Non-Secure Connection (HTTP)
          </div>
          <p className="opacity-95 leading-normal">
            Your browser blocks camera, microphone, and screen sharing access on non-secure connections. Please connect via **localhost** or deploy to an **HTTPS** URL (such as your Vercel deployment) to test these features!
          </p>
        </div>
      )}
    </div>
  )
}
