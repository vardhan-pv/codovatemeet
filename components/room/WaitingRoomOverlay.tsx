'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Clock, Check, X, Users, Lock, Sparkles, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WaitingParticipant {
  identity: string
  name: string
  email: string
  requestedAt: number
}

interface WaitingRoomScreenProps {
  meetingTitle: string
  roomId: string
  hostName?: string
  onLeave: () => void
}

export function WaitingRoomScreen({
  meetingTitle,
  roomId,
  hostName = 'Host',
  onLeave
}: WaitingRoomScreenProps) {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-6 bg-[#050816] text-white select-none">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6"
      >
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-4 border-t-blue-500 animate-spin" />
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold block mb-1">
            Waiting Room Active
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">{meetingTitle || 'Meeting Lobby'}</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Please wait, the meeting host ({hostName}) has been notified and will admit you shortly.
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-2xl border border-white/5 text-xs text-slate-300 font-mono flex items-center justify-between">
          <span className="text-slate-500">Room Code</span>
          <span className="font-bold text-blue-400">{roomId}</span>
        </div>

        <Button
          onClick={onLeave}
          variant="outline"
          className="w-full h-11 rounded-2xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold text-xs"
        >
          Leave Lobby
        </Button>
      </motion.div>
    </div>
  )
}

interface HostAdmissionBannerProps {
  waitingList: WaitingParticipant[]
  onAdmit: (identity: string) => void
  onReject: (identity: string) => void
  onAdmitAll: () => void
}

export function HostAdmissionBanner({
  waitingList,
  onAdmit,
  onReject,
  onAdmitAll
}: HostAdmissionBannerProps) {
  if (!waitingList || waitingList.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-xl bg-slate-950/90 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-4 shadow-2xl shadow-blue-500/10 text-white flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-300 block">
              {waitingList.length} Participant{waitingList.length > 1 ? 's' : ''} in Waiting Room
            </span>
            <span className="text-[11px] text-slate-300 block mt-0.5 truncate max-w-sm">
              {waitingList[0].name} ({waitingList[0].email}) is requesting to join.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onAdmit(waitingList[0].identity)}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Admit
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject(waitingList[0].identity)}
            className="h-8 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <UserX className="w-3.5 h-3.5" />
          </Button>

          {waitingList.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAdmitAll}
              className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200"
            >
              Admit All
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
