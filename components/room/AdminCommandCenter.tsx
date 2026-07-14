import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Room } from 'livekit-client'
import {
  ShieldAlert, Settings, Users, Code, Paintbrush, 
  MessageSquare, HardDrive, Video, Activity,
  Lock, StopCircle, UserMinus, MicOff, VideoOff,
  Terminal, X, ChevronRight, Share2, Play, Sparkles
} from 'lucide-react'

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
  meetingType: string
  setMeetingType: (type: string) => void
}

export function AdminCommandCenter({ 
  room, participants, sendData, adminSettings, onClose, meetingHostId, user, metrics, userRoles = {}, meetingType, setMeetingType 
}: AdminCommandCenterProps) {
  const [activeTab, setActiveTab] = useState('meeting')

  const tabs = [
    { id: 'meeting', label: 'Meeting Control', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'code', label: 'Live Code', icon: Code },
    { id: 'whiteboard', label: 'Whiteboard', icon: Paintbrush },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'analytics', label: 'Live Analytics', icon: Activity },
  ]

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
    broadcastAdminCommand(command, 'ALL', newValue)
  }

  const handleForceMuteAll = () => {
    broadcastAdminCommand('FORCE_MUTE', 'ALL')
    broadcastAdminCommand('TOGGLE_MIC_LOCK', 'ALL', true)
  }

  const handleAllowUnmuteAll = () => {
    broadcastAdminCommand('TOGGLE_MIC_LOCK', 'ALL', false)
  }

  const handleForceVideoOffAll = () => {
    broadcastAdminCommand('FORCE_VIDEO_OFF', 'ALL')
    broadcastAdminCommand('TOGGLE_CAMERA_LOCK', 'ALL', true)
  }

  const handleAllowVideoAll = () => {
    broadcastAdminCommand('TOGGLE_CAMERA_LOCK', 'ALL', false)
  }

  const handleKickParticipant = (participantId: string) => {
    broadcastAdminCommand('KICK_USER', participantId)
  }

  const handleForceMute = (participantId: string) => {
    broadcastAdminCommand('FORCE_MUTE', participantId)
  }

  const handleRoleChange = (participantId: string, role: string) => {
    broadcastAdminCommand('SET_ROLE', participantId, role)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      style={{ zIndex: 9999 }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="premium-card w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col lg:flex-row overflow-hidden border border-white/10 shadow-2xl relative"
        style={{ zIndex: 10000 }}
      >
        {/* Mobile Header & Tabs */}
        <div className="lg:hidden w-full flex flex-col shrink-0 bg-secondary/80 border-b border-white/5">
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-xs leading-tight">Command Center</h2>
                <p className="text-[9px] text-muted-foreground">Admin Privileges</p>
              </div>
            </div>
            <Button onClick={onClose} size="xs" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <X className="h-3 w-3 mr-1" /> Close
            </Button>
          </div>
          
          <div className="flex overflow-x-auto p-2 gap-1.5 scrollbar-none scroll-smooth">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex w-64 bg-secondary/80 border-r border-white/5 flex-col shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm leading-tight">Command Center</h2>
              <p className="text-[10px] text-muted-foreground">Admin Privileges</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
                </button>
              )
            })}
          </div>

          <div className="p-4 border-t border-white/5">
            <Button onClick={onClose} variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
              <X className="h-4 w-4 mr-2" /> Close Dashboard
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-background/50 overflow-y-auto custom-scrollbar relative">
          
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            
            {/* Live Metrics Header */}
            <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2.5 sm:gap-3">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />
                <div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none">Participants</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight mt-1">{participants.length}</p>
                </div>
              </div>
              <div className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2.5 sm:gap-3">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none">Meeting Mode</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight mt-1">
                    {typeLabels[meetingType] || meetingType || 'Standard'}
                  </p>
                </div>
              </div>
              <div className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2.5 sm:gap-3">
                <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                <div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none">Status</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight mt-1">
                    {adminSettings.isRoomLocked ? <span className="text-red-400">Locked</span> : <span className="text-emerald-400">Open</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            
            {/* ── MEETING CONTROL ── */}
            {activeTab === 'meeting' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between col-span-1 md:col-span-2 hidden">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Meeting Mode</h4>
                      <p className="text-xs text-muted-foreground mt-1">Change the workspace layout dynamically based on meeting intent.</p>
                    </div>
                    <select
                      className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none font-semibold focus:border-primary transition-colors cursor-pointer"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                    >
                      <option value="technical">Technical / Code Review</option>
                      <option value="interview">Technical Interview</option>
                      <option value="business">Business / Standup</option>
                      <option value="education">Classroom / Education</option>
                    </select>
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Meeting</h4>
                      <p className="text-xs text-muted-foreground mt-1">Prevent new participants from joining</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isRoomLocked}
                      onCheckedChange={() => toggleSetting('isRoomLocked', 'TOGGLE_ROOM_LOCK')}
                    />
                  </div>

                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">End Meeting For All</h4>
                      <p className="text-xs text-muted-foreground mt-1">Terminate session and disconnect everyone</p>
                    </div>
                    <Button onClick={() => broadcastAdminCommand('END_MEETING_ALL', 'ALL')} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 font-bold">
                      Force End
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Mass Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Audio Controls */}
                    <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Audio Management</p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={handleForceMuteAll} 
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold shrink-0 transition-colors"
                          size="sm"
                        >
                          <MicOff className="h-3.5 w-3.5 mr-1.5" /> Mute & Lock Everyone
                        </Button>
                        <Button 
                          onClick={handleAllowUnmuteAll} 
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 text-xs font-bold shrink-0 transition-colors"
                          size="sm"
                        >
                          <Mic className="h-3.5 w-3.5 mr-1.5" /> Unmute & Unlock Everyone
                        </Button>
                      </div>
                    </div>

                    {/* Video Controls */}
                    <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Video Management</p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={handleForceVideoOffAll} 
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold shrink-0 transition-colors"
                          size="sm"
                        >
                          <VideoOff className="h-3.5 w-3.5 mr-1.5" /> Stop & Lock Video
                        </Button>
                        <Button 
                          onClick={handleAllowVideoAll} 
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 text-xs font-bold shrink-0 transition-colors"
                          size="sm"
                        >
                          <Video className="h-3.5 w-3.5 mr-1.5" /> Start & Unlock Video
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── PARTICIPANTS ── */}
            {activeTab === 'participants' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Mobile View: Cards */}
                <div className="space-y-3 md:hidden">
                  {participants.map(p => (
                    <div key={p.sid || p.identity} className="bg-secondary/40 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {(p.identity || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-sm truncate">{p.identity || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400">
                              Joined {p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                        {p.identity === meetingHostId && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-bold shrink-0">Host</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role</label>
                          <select 
                            className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
                            value={userRoles?.[p.identity] || 'Participant'}
                            onChange={(e) => handleRoleChange(p.identity, e.target.value)}
                          >
                            <option value="Participant">Participant</option>
                            <option value="Co-host">Co-host</option>
                            <option value="Guest">Guest (View Only)</option>
                          </select>
                        </div>
                        
                        <div className="flex items-end gap-1.5 self-end">
                          <Button size="icon" variant="ghost" onClick={() => handleForceMute(p.identity)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 shrink-0" title="Force Mute">
                            <MicOff className="h-4 w-4" />
                          </Button>
                          {p.identity !== meetingHostId && (
                            <Button size="icon" variant="ghost" onClick={() => handleKickParticipant(p.identity)} className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-500/20 shrink-0" title="Remove User">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block bg-secondary/40 border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-black/20 border-b border-white/5 text-xs text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-bold">Participant</th>
                        <th className="p-4 font-bold">Role</th>
                        <th className="p-4 font-bold">Joined At</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {participants.map(p => (
                        <tr key={p.sid || p.identity} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                {(p.identity || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-white text-sm">{p.identity || 'Unknown'}</span>
                              {p.identity === meetingHostId && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-bold">Host</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            <select 
                              className="bg-background border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                              value={userRoles?.[p.identity] || 'Participant'}
                              onChange={(e) => handleRoleChange(p.identity, e.target.value)}
                            >
                              <option value="Participant">Participant</option>
                              <option value="Co-host">Co-host</option>
                              <option value="Guest">Guest (View Only)</option>
                            </select>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString() : 'Just now'}
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleForceMute(p.identity)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10" title="Force Mute">
                              <MicOff className="h-4 w-4" />
                            </Button>
                            {p.identity !== meetingHostId && (
                              <Button size="icon" variant="ghost" onClick={() => handleKickParticipant(p.identity)} className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-500/20" title="Remove User">
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── LIVE CODE ── */}
            {activeTab === 'code' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/40 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Code Editor</h4>
                      <p className="text-xs text-muted-foreground mt-1">Make code read-only for participants</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isCodeLocked}
                      onCheckedChange={() => toggleSetting('isCodeLocked', 'TOGGLE_CODE_LOCK')}
                    />
                  </div>
                  
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Force Terminal Sync</h4>
                      <p className="text-xs text-muted-foreground mt-1">Sync everyone's terminal view to host</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                      onClick={() => broadcastAdminCommand('SYNC_TERMINAL', 'ALL')}
                    >
                      Sync Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── WHITEBOARD ── */}
            {activeTab === 'whiteboard' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/40 border border-orange-500/20 rounded-xl p-5 flex items-center justify-between shadow-[0_0_15px_rgba(249,115,22,0.05)]">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Lock Whiteboard</h4>
                      <p className="text-xs text-muted-foreground mt-1">Only host can draw</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isWhiteboardLocked}
                      onCheckedChange={() => toggleSetting('isWhiteboardLocked', 'TOGGLE_WHITEBOARD_LOCK')}
                    />
                  </div>
                  
                  <div className="bg-secondary/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">Clear Board for All</h4>
                      <p className="text-xs text-muted-foreground mt-1">Wipe canvas data permanently</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                      onClick={() => broadcastAdminCommand('WHITEBOARD_CLEAR', 'ALL')}
                    >
                      Clear Board
                    </Button>
                  </div>
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
                      <p className="text-xs text-muted-foreground mt-1">Prevent users from sending messages</p>
                    </div>
                    <Switch 
                      checked={adminSettings.isChatDisabled}
                      onCheckedChange={() => toggleSetting('isChatDisabled', 'TOGGLE_CHAT_LOCK')}
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
                
                <div className="bg-secondary/40 border border-white/5 rounded-xl p-6 h-64 flex items-center justify-center">
                  <p className="text-slate-500 font-mono text-xs text-center">
                    [Live Engagement Graph Placeholder]<br/>
                    Tracking audio activity, code contributions, and AI usage over time.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  )
}
