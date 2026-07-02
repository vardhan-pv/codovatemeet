import { motion } from 'framer-motion'
import { Mic, MicOff, PhoneOff, ArrowLeft, Activity } from 'lucide-react'

interface OnToGoOverlayProps {
  isMuted: boolean
  onToggleMute: () => void
  onLeaveCall: () => void
  onExitMode: () => void
  roomId: string
  participantsCount: number
}

export function OnToGoOverlay({ 
  isMuted, 
  onToggleMute, 
  onLeaveCall, 
  onExitMode, 
  roomId, 
  participantsCount 
}: OnToGoOverlayProps) {
  
  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col justify-between p-6 sm:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onExitMode}
          className="flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit On-the-Go Mode
        </button>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full text-xs font-bold text-slate-300 border border-white/5">
          <span className="text-indigo-400 font-mono tracking-wider">{roomId}</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full mx-1"></span>
          <span>{participantsCount} {participantsCount === 1 ? 'person' : 'people'}</span>
        </div>
      </div>

      {/* Center Animation / Status */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8">
        <motion.div 
          animate={isMuted ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
            isMuted 
              ? 'bg-rose-500/10 shadow-rose-500/20 border border-rose-500/20' 
              : 'bg-emerald-500/20 shadow-emerald-500/40 border-2 border-emerald-500/40'
          }`}
        >
          {isMuted ? (
            <MicOff className="h-12 w-12 text-rose-500 opacity-80" />
          ) : (
            <Activity className="h-14 w-14 text-emerald-400" />
          )}
        </motion.div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isMuted ? 'Microphone Muted' : 'You are Live'}
          </h2>
          <p className="text-sm font-semibold text-slate-400 max-w-xs mx-auto">
            {isMuted 
              ? 'Tap the large button below when you are ready to speak.' 
              : 'Everyone in the meeting can hear you.'}
          </p>
        </div>
      </div>

      {/* Massive Bottom Controls */}
      <div className="flex flex-col gap-4 pb-4">
        <button
          onClick={onToggleMute}
          className={`w-full h-24 rounded-[32px] flex items-center justify-center gap-4 text-xl font-black transition-all duration-300 shadow-2xl active:scale-95 ${
            isMuted 
              ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' 
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/20 border-none'
          }`}
        >
          {isMuted ? (
            <>
              <MicOff className="h-7 w-7" /> Tap to Unmute
            </>
          ) : (
            <>
              <Mic className="h-7 w-7 animate-pulse" /> Mute Microphone
            </>
          )}
        </button>

        <button
          onClick={onLeaveCall}
          className="w-full h-16 rounded-[24px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 flex items-center justify-center gap-3 text-lg font-bold transition-all duration-300 active:scale-95"
        >
          <PhoneOff className="h-5 w-5" /> Leave Call
        </button>
      </div>
    </div>
  )
}
