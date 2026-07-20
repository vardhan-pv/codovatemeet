'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Mic,
  Monitor,
  Radio,
  Play,
  Pause,
  Square,
  Download,
  X,
  Lock,
  Sparkles,
  FileText,
  Subtitles,
  CheckCircle2,
  AlertTriangle,
  HardDrive
} from 'lucide-react'
import { RecordingMode, RecordingQuality } from '@/hooks/useMeetingRecorder'
import { exportTranscriptFile } from '@/lib/transcriptExporter'
import { Button } from '@/components/ui/button'

interface MeetingRecorderModalProps {
  isOpen: boolean
  onClose: () => void
  isRecording: boolean
  isPaused: boolean
  recordingTimeSecs: number
  recordedBlob: Blob | null
  recordedUrl: string | null
  onStartRecording: (mode: RecordingMode, quality: RecordingQuality) => void
  onStopRecording: () => void
  onPauseRecording: () => void
  onResumeRecording: () => void
  onDownloadLocal: (filename?: string) => void
  isRecordingLocked?: boolean
  isHost?: boolean
  roomId: string
  transcriptItems?: any[]
}

export function MeetingRecorderModal({
  isOpen,
  onClose,
  isRecording,
  isPaused,
  recordingTimeSecs,
  recordedBlob,
  recordedUrl,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDownloadLocal,
  isRecordingLocked = false,
  isHost = false,
  roomId,
  transcriptItems = []
}: MeetingRecorderModalProps) {
  const [selectedMode, setSelectedMode] = useState<RecordingMode>('full_meeting')
  const [selectedQuality, setSelectedQuality] = useState<RecordingQuality>('720p')

  if (!isOpen) return null

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <Radio className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Meeting Recording & Local Export
                </h3>
                <p className="text-xs text-slate-400">
                  Save high-definition video, audio & transcripts directly to your local machine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Admin Permission Lock Notice */}
            {isRecordingLocked && !isHost && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs">
                  Meeting recording has been disabled by the meeting host.
                </p>
              </div>
            )}

            {/* Live Active Recording View */}
            {isRecording ? (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/40 text-center space-y-4 shadow-xl shadow-rose-500/5">
                <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-2xl font-bold tracking-widest">
                  <span className="w-4 h-4 bg-rose-500 rounded-full animate-ping" />
                  <span>REC {formatTimer(recordingTimeSecs)}</span>
                </div>

                <p className="text-xs text-slate-300">
                  {isPaused ? 'Recording Paused' : 'Live recording active. Capturing stream & WebAudio.'}
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {isPaused ? (
                    <Button
                      onClick={onResumeRecording}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 h-10 px-4 rounded-xl"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </Button>
                  ) : (
                    <Button
                      onClick={onPauseRecording}
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold gap-1.5 h-10 px-4 rounded-xl"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </Button>
                  )}

                  <Button
                    onClick={onStopRecording}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1.5 h-10 px-4 rounded-xl shadow-lg shadow-rose-600/30"
                  >
                    <Square className="w-4 h-4" /> Stop & Download
                  </Button>
                </div>
              </div>
            ) : recordedBlob ? (
              /* Post-Recording Local Download & Export View */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recording Saved Successfully!</span>
                  </div>

                  {recordedUrl && (
                    <video
                      src={recordedUrl}
                      controls
                      className="w-full aspect-video rounded-xl bg-black border border-white/10"
                    />
                  )}

                  <Button
                    onClick={() => onDownloadLocal()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-emerald-600/20 gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    Export Video to Local Machine (.webm / .mp4)
                  </Button>
                </div>

                {/* Export Subtitles (.srt / .vtt) */}
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    Export Speech Subtitles & Transcripts
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTranscriptFile(transcriptItems, 'srt', roomId)}
                      className="flex-1 text-xs border-slate-700 bg-slate-800 text-slate-200 gap-1"
                    >
                      <Subtitles className="w-3.5 h-3.5" /> Download .SRT Subtitles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTranscriptFile(transcriptItems, 'vtt', roomId)}
                      className="flex-1 text-xs border-slate-700 bg-slate-800 text-slate-200 gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download .VTT Subtitles
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Start Recording Configuration Form */
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                    Select Recording Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedMode('full_meeting')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedMode === 'full_meeting'
                          ? 'bg-rose-600/20 border-rose-500 text-white'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <Video className="w-4 h-4 text-rose-400 mb-2" />
                      <span className="text-xs font-semibold block">Full Meeting</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Video + Audio</span>
                    </button>

                    <button
                      onClick={() => setSelectedMode('screen_share')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedMode === 'screen_share'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <Monitor className="w-4 h-4 text-blue-400 mb-2" />
                      <span className="text-xs font-semibold block">Screen Share</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Presentation</span>
                    </button>

                    <button
                      onClick={() => setSelectedMode('audio_only')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedMode === 'audio_only'
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <Mic className="w-4 h-4 text-purple-400 mb-2" />
                      <span className="text-xs font-semibold block">Audio Only</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">MP3/WebM Audio</span>
                    </button>
                  </div>
                </div>

                {/* Quality Selector */}
                {selectedMode !== 'audio_only' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                      Video Quality Preset
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1080p', '720p', '480p'] as RecordingQuality[]).map((q) => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuality(q)}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            selectedQuality === q
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {q} HD
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Start Recording Button */}
                <Button
                  disabled={isRecordingLocked && !isHost}
                  onClick={() => onStartRecording(selectedMode, selectedQuality)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-11 rounded-2xl shadow-lg shadow-rose-600/30 gap-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  Start Recording Session
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
