import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Room } from 'livekit-client'
import {
  ShieldAlert, Settings, Users, Code, Paintbrush, 
  MessageSquare, HardDrive, Video, Activity,
  Lock, StopCircle, UserMinus, MicOff, VideoOff, Mic,
  Terminal, X, ChevronRight, Share2, Play, Sparkles,
  Wifi, Gauge, Zap, Radio
} from 'lucide-react'
import { NetworkStats, NetworkOptimizationConfig } from '@/lib/network-adaptive-engine'

const typeLabels: Record<string, string> = {
  technical: 'Technical / Code Review',
  interview: 'Technical Interview',
  business: 'Business / Standup',
  education: 'Classroom / Education',
  brainstorming: 'Brainstorming',
  standup: 'Standup'
}

export interface AdminSettings {
  isRoomLocked: boolean
  isCodeLocked: boolean
  isWhiteboardLocked: boolean
  isChatDisabled: boolean
  isAiDisabled: boolean
  isScreenShareLocked: boolean
  isMicLocked: boolean
  isCameraLocked: boolean
  isRecordingLocked: boolean
  waitingRoom: boolean
  isDmDisabled?: boolean
  isGamesDisabled?: boolean
  isParticipantListHidden?: boolean
  isParticipantInfoRestricted?: boolean
}

interface AdminCommandCenterProps {
  room: Room | null
  participants: any[]
  sendData: (type: string, payload: any) => void
  adminSettings: AdminSettings
  onClose: () => void
  meetingHostId: string
  user: any
  metrics?: { codeEdits: number, chatMsgs: number, aiRequests: number }
  userRoles?: Record<string, string>
  userRecordingPermissions?: Record<string, boolean>
  meetingType: string
  setMeetingType: (type: string) => void
  adaptiveStats?: NetworkStats
  adaptiveConfig?: NetworkOptimizationConfig
  onUpdateAdaptiveConfig?: (config: Partial<NetworkOptimizationConfig>) => void
  onToggleUserRecordingPermission?: (userId: string) => void
  onUpdateAdminSetting?: (key: keyof AdminSettings, value: boolean) => void
}

export function AdminCommandCenter({ 
  room,
  participants,
  sendData,
  adminSettings,
  onClose,
  meetingHostId,
  user,
  metrics,
  userRoles = {},
  userRecordingPermissions = {},
  meetingType,
  setMeetingType,
  adaptiveStats,
  adaptiveConfig,
  onUpdateAdaptiveConfig,
  onToggleUserRecordingPermission,
  onUpdateAdminSetting
}: AdminCommandCenterProps) {
  const isHost = Boolean(
    (meetingHostId && user && (user.id === meetingHostId || (user.email && user.email === meetingHostId))) ||
    (userRoles['Host'] === 'Host' || userRoles['Co-Host'] === 'Co-Host')
  )

  const [activeTab, setActiveTab] = useState<string>('general')

  const tabs: { id: string; label: string; icon: any }[] = [
    { id: 'general', label: 'Security & Access', icon: ShieldAlert },
    { id: 'participants', label: 'Participant Management', icon: Users },
    { id: 'network', label: 'Adaptive Network', icon: Wifi },
    { id: 'code', label: 'Code Workspace', icon: Code },
    { id: 'whiteboard', label: 'Whiteboard', icon: Paintbrush },
    { id: 'security', label: 'Permissions & Chat', icon: Lock },
    { id: 'analytics', label: 'Live Analytics', icon: Activity },
  ]

  if (!isHost) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Restricted</h3>
          <p className="text-sm text-slate-300">
            Only the meeting host or co-hosts can access the Admin Command Center and security settings.
          </p>
          <Button onClick={onClose} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold">
            Close
          </Button>
        </div>
      </div>
    )
  }

  // Helper to send Admin Commands
  const broadcastAdminCommand = (command: string, targetId?: string, value?: any) => {
    sendData('ADMIN_COMMAND', {
      command,
      targetId,
      value,
      timestamp: Date.now()
    })
  }

  // --- Actions ---
  const toggleSetting = (key: keyof AdminSettings, command: string) => {
    const newValue = !adminSettings[key]
    if (onUpdateAdminSetting) {
      onUpdateAdminSetting(key, newValue)
    }
    broadcastAdminCommand(command, 'ALL', newValue)
  }

  const handleForceMuteAll = () => {
    broadcastAdminCommand('FORCE_MUTE_LOCK', 'ALL')
  }

  const handleForceCameraOffAll = () => {
    broadcastAdminCommand('FORCE_CAMERA_LOCK', 'ALL')
  }

  const handleMuteUser = (targetId: string) => {
    broadcastAdminCommand('MUTE_USER', targetId)
  }

  const handleTurnOffCameraUser = (targetId: string) => {
    broadcastAdminCommand('CAMERA_OFF_USER', targetId)
  }

  const handleKickUser = (targetId: string) => {
    broadcastAdminCommand('KICK_USER', targetId)
  }

  const handleToggleRole = (targetId: string, currentRole: string) => {
    const nextRole = currentRole === 'cohost' ? 'participant' : 'cohost'
    broadcastAdminCommand('SET_ROLE', targetId, nextRole)
  }

  const handleToggleRecordingPerm = (targetId: string) => {
    if (onToggleUserRecordingPermission) {
      onToggleUserRecordingPermission(targetId)
    }
    const currentVal = !!userRecordingPermissions[targetId]
    broadcastAdminCommand('GRANT_RECORDING_PERMISSION', targetId, !currentVal)
  }

  const handleSendToWaitingRoom = (targetId: string) => {
    broadcastAdminCommand('SEND_TO_WAITING_ROOM', targetId)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-background border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Admin Command Center</h2>
              <p className="text-xs text-muted-foreground">Comprehensive host governance and meeting moderation</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Layout Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 bg-secondary/10 border-r border-white/5 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {/* ── MEETING CONTROL ── */}
            {activeTab === 'meeting' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Meeting Room</h4>
                      <p className="text-xs text-muted-foreground mt-1">Block new participants from joining</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isRoomLocked}
                      onCheckedChange={() => toggleSetting('isRoomLocked', 'TOGGLE_ROOM_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Microphone (Mute All)</h4>
                      <p className="text-xs text-muted-foreground mt-1">Prevent non-hosts from unmuting</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isMicLocked}
                      onCheckedChange={() => toggleSetting('isMicLocked', 'TOGGLE_MIC_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Video Cameras</h4>
                      <p className="text-xs text-muted-foreground mt-1">Prevent non-hosts from enabling camera</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isCameraLocked}
                      onCheckedChange={() => toggleSetting('isCameraLocked', 'TOGGLE_CAMERA_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-rose-500/30 bg-rose-950/20 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-rose-400" />
                        Allow Participants to Record
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Permit users to record meeting session to their machine
                      </p>
                    </div>
                    <Switch 
                      checked={!adminSettings.isRecordingLocked}
                      onCheckedChange={() => toggleSetting('isRecordingLocked', 'TOGGLE_RECORDING_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-blue-500/30 bg-blue-950/20 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-400" />
                        Waiting Room
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Require host approval before participants enter the meeting
                      </p>
                    </div>
                    <Switch 
                      checked={adminSettings.waitingRoom}
                      onCheckedChange={() => toggleSetting('waitingRoom', 'TOGGLE_WAITING_ROOM')}
                    />
                  </div>
                </div>

                {/* Quick Global Actions */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Global Moderation Commands</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleForceMuteAll} variant="destructive" className="text-xs gap-2">
                      <MicOff className="h-4 w-4" /> Mute & Lock All Mics
                    </Button>
                    <Button onClick={handleForceCameraOffAll} variant="destructive" className="text-xs gap-2">
                      <VideoOff className="h-4 w-4" /> Turn Off All Cameras
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── NETWORK QUALITY & ADAPTIVE CENTER ── */}
            {activeTab === 'network' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Wifi className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Adaptive Network & Quality Center</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          adaptiveStats?.level === 'EXCELLENT' || adaptiveStats?.level === 'GOOD'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : adaptiveStats?.level === 'FAIR'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {adaptiveStats?.level || 'EXCELLENT'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real-time WebRTC telemetry monitoring and adaptive quality enforcement
                      </p>
                    </div>
                  </div>

                  {/* Enforce Low Bandwidth Broadcast Button */}
                  <Button
                    onClick={() => {
                      if (onUpdateAdaptiveConfig) {
                        const newMode = adaptiveConfig?.mode === 'low_bandwidth' ? 'auto' : 'low_bandwidth'
                        onUpdateAdaptiveConfig({ mode: newMode })
                        broadcastAdminCommand('SET_NETWORK_MODE', 'ALL', newMode)
                      }
                    }}
                    className={`h-10 px-4 font-bold text-xs rounded-xl shadow-lg gap-2 shrink-0 ${
                      adaptiveConfig?.mode === 'low_bandwidth'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {adaptiveConfig?.mode === 'low_bandwidth' ? 'Disable Low Bandwidth Mode' : 'Enforce Room Low-Bandwidth Mode'}
                  </Button>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-white/5 text-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Latency (RTT)</span>
                    <span className="text-xl font-mono font-black text-white block mt-1">{adaptiveStats?.rtt || 35} ms</span>
                    <span className="text-[10px] text-emerald-400 font-mono block">Jitter: {adaptiveStats?.jitter || 4} ms</span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/40 border border-white/5 text-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Packet Loss</span>
                    <span className="text-xl font-mono font-black text-white block mt-1">{((adaptiveStats?.packetLoss || 0.1) * 100).toFixed(1)}%</span>
                    <span className="text-[10px] text-blue-400 font-mono block">WebRTC Stability</span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/40 border border-white/5 text-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Recommended Res</span>
                    <span className="text-xl font-mono font-black text-indigo-400 block mt-1">{adaptiveStats?.recommendedResolution || '720p'}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">@{adaptiveStats?.recommendedFps || 24} fps</span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/40 border border-white/5 text-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Downlink Speed</span>
                    <span className="text-xl font-mono font-black text-emerald-400 block mt-1">{adaptiveStats?.downlinkKbps || 2500} Kbps</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Up: {adaptiveStats?.uplinkKbps || 1800} Kbps</span>
                  </div>
                </div>

                {/* Adaptive Mode Selection Cards */}
                <div className="grid md:grid-cols-3 gap-3">
                  <button
                    onClick={() => onUpdateAdaptiveConfig && onUpdateAdaptiveConfig({ mode: 'auto' })}
                    className={`p-4 rounded-xl border text-left transition ${
                      adaptiveConfig?.mode === 'auto'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-secondary/40 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <Activity className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="text-xs font-bold block">Auto Adaptive Mode</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Dynamic 1080p-180p resolution tuning based on live network quality
                    </span>
                  </button>

                  <button
                    onClick={() => onUpdateAdaptiveConfig && onUpdateAdaptiveConfig({ mode: 'low_bandwidth' })}
                    className={`p-4 rounded-xl border text-left transition ${
                      adaptiveConfig?.mode === 'low_bandwidth'
                        ? 'bg-rose-600/20 border-rose-500 text-white'
                        : 'bg-secondary/40 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <Gauge className="w-5 h-5 text-rose-400 mb-2" />
                    <span className="text-xs font-bold block">Low Bandwidth Mode</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Caps video bitrate to 250 Kbps, 360p resolution, audio prioritized
                    </span>
                  </button>

                  <button
                    onClick={() => onUpdateAdaptiveConfig && onUpdateAdaptiveConfig({ mode: 'audio_only' })}
                    className={`p-4 rounded-xl border text-left transition ${
                      adaptiveConfig?.mode === 'audio_only'
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-secondary/40 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-purple-400 mb-2" />
                    <span className="text-xs font-bold block">Audio-Only Mode</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Pauses video streams completely to guarantee crystal-clear conversations
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── PARTICIPANTS ── */}
            {activeTab === 'participants' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Connected Participants ({participants.length})</h4>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                  {participants.map((p) => {
                    const id = p.identity || p.sid
                    const isCoHost = userRoles[id] === 'cohost'
                    const isHost = id === meetingHostId
                    const canRecord = !adminSettings.isRecordingLocked || !!userRecordingPermissions[id]

                    return (
                      <div key={id} className="bg-secondary/30 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {(p.identity || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{(p.identity || 'User').split('_')[0]}</span>
                              {isHost && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-mono">HOST</span>}
                              {isCoHost && <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded font-mono">CO-HOST</span>}
                              {canRecord && !isHost && <span className="bg-rose-500/20 text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-mono">REC ALLOWED</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{id}</p>
                          </div>
                        </div>

                        {!isHost && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Grant/Revoke Recording Permission */}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleToggleRecordingPerm(id)} 
                              title={canRecord ? "Revoke Recording Permission" : "Grant Recording Permission"} 
                              className={`h-8 px-2 text-[10px] font-bold gap-1 ${
                                canRecord 
                                  ? 'text-rose-400 hover:bg-rose-500/10' 
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Radio className="h-3 w-3" />
                              {canRecord ? 'Revoke Rec' : 'Grant Rec'}
                            </Button>

                            <Button size="sm" variant="ghost" onClick={() => handleMuteUser(id)} title="Mute Participant" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                              <MicOff className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleTurnOffCameraUser(id)} title="Turn Off Camera" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                              <VideoOff className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleSendToWaitingRoom(id)} title="Send back to Waiting Room" className="h-8 px-2 text-[10px] text-amber-400 hover:bg-amber-500/10">
                              Lobby
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleRole(id, userRoles[id] || 'participant')} title={isCoHost ? "Demote from Co-Host" : "Make Co-Host"} className="h-8 px-2 text-[10px] text-indigo-400 hover:bg-indigo-500/10">
                              {isCoHost ? 'Demote' : '+ CoHost'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleKickUser(id)} title="Remove Participant" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── LIVE CODE ── */}
            {activeTab === 'code' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Lock Code Workspace</h4>
                    <p className="text-xs text-muted-foreground mt-1">Restrict code editing to hosts only</p>
                  </div>
                  <Switch 
                    checked={adminSettings.isCodeLocked}
                    onCheckedChange={() => toggleSetting('isCodeLocked', 'TOGGLE_CODE_LOCK')}
                  />
                </div>
              </div>
            )}

            {/* ── WHITEBOARD ── */}
            {activeTab === 'whiteboard' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Lock Whiteboard Workspace</h4>
                    <p className="text-xs text-muted-foreground mt-1">Restrict whiteboard drawing to hosts only</p>
                  </div>
                  <Switch 
                    checked={adminSettings.isWhiteboardLocked}
                    onCheckedChange={() => toggleSetting('isWhiteboardLocked', 'TOGGLE_WHITEBOARD_LOCK')}
                  />
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Disable Chat</h4>
                      <p className="text-xs text-muted-foreground mt-1">Prevent users from sending public chat messages</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isChatDisabled}
                      onCheckedChange={() => toggleSetting('isChatDisabled', 'TOGGLE_CHAT_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Disable Direct Messages (DMs)</h4>
                      <p className="text-xs text-muted-foreground mt-1">Prevent private 1-on-1 messaging</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isDmDisabled || false}
                      onCheckedChange={() => toggleSetting('isDmDisabled' as any, 'TOGGLE_DM_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Disable Games & Activities</h4>
                      <p className="text-xs text-muted-foreground mt-1">Lock active games like UNO during meeting</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isGamesDisabled || false}
                      onCheckedChange={() => toggleSetting('isGamesDisabled' as any, 'TOGGLE_GAMES_LOCK')}
                    />
                  </div>
                  
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Disable AI Assistant</h4>
                      <p className="text-xs text-muted-foreground mt-1">Turn off AI context and commands</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isAiDisabled}
                      onCheckedChange={() => toggleSetting('isAiDisabled', 'TOGGLE_AI_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Restrict Screen Share</h4>
                      <p className="text-xs text-muted-foreground mt-1">Only host can share screen</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isScreenShareLocked}
                      onCheckedChange={() => toggleSetting('isScreenShareLocked', 'TOGGLE_SCREENSHARE_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Hide Participant List</h4>
                      <p className="text-xs text-muted-foreground mt-1">Hide participant panel from non-hosts</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isParticipantListHidden || false}
                      onCheckedChange={() => toggleSetting('isParticipantListHidden' as any, 'TOGGLE_HIDE_PARTICIPANTS')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Restrict Participant Info</h4>
                      <p className="text-xs text-muted-foreground mt-1">Hide email & metadata for participant privacy</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isParticipantInfoRestricted || false}
                      onCheckedChange={() => toggleSetting('isParticipantInfoRestricted' as any, 'TOGGLE_RESTRICT_INFO')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Users', val: participants.length, icon: Users, color: 'text-blue-400' },
                    { label: 'Code Edits', val: metrics?.codeEdits || 0, icon: Code, color: 'text-emerald-400' },
                    { label: 'AI Requests', val: metrics?.aiRequests || 0, icon: Terminal, color: 'text-purple-400' },
                    { label: 'Chat Msgs', val: metrics?.chatMsgs || 0, icon: MessageSquare, color: 'text-cyan-400' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-secondary/40 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col justify-center items-center text-center">
                      <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 ${stat.color}`} />
                      <p className="text-xl sm:text-2xl font-black text-white">{stat.val}</p>
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  )
}
