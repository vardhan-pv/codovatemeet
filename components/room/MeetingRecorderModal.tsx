'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Mic,
  MicOff,
  Monitor,
  Radio,
  Play,
  Pause,
  Square,
  X,
  Lock,
  FileText,
  Subtitles,
  CheckCircle2,
  HardDrive,
  RotateCcw,
  Volume2,
  VolumeX,
  Cloud
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
  onStartRecording: (mode: RecordingMode, quality: RecordingQuality, withAudio: boolean) => void
  onStopRecording: () => void
  onPauseRecording: () => void
  onResumeRecording: () => void
  onDownloadLocal: (filename?: string) => void
  onResetRecorder: () => void
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
  onResetRecorder,
  isRecordingLocked = false,
  isHost = false,
  roomId,
  transcriptItems = []
}: MeetingRecorderModalProps) {
  const [selectedMode, setSelectedMode] = useState<RecordingMode>('full_meeting')
  const [selectedQuality, setSelectedQuality] = useState<RecordingQuality>('720p')
  const [withAudio, setWithAudio] = useState<boolean>(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  if (!isOpen) return null

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSaveToCloud = async () => {
    if (!recordedBlob) return
    setIsUploading(true)
    setUploadStatus('Uploading recording to cloud...')
    try {
      const formData = new FormData()
      formData.append('recording', recordedBlob, `meeting-${roomId}-${Date.now()}.webm`)

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/recordings/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      if (response.ok) {
        setUploadStatus('Recording saved to cloud folder successfully!')
      } else {
        const errorData = await response.json()
        setUploadStatus(`Upload failed: ${errorData.error || 'Server error'}`)
      }
    } catch (e: any) {
      setUploadStatus(`Upload failed: ${e.message || 'Network error'}`)
    } finally {
      setIsUploading(false)
    }
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
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-sans">
                  Session Recorder & Cloud Exporter
                </h3>
                <p className="text-xs text-slate-400">
                  Record meeting session directly to cloud or local computer
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
                  Meeting session recording has been locked by the host administrator.
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
                  {isPaused
                    ? 'Recording Paused'
                    : `Capturing ${selectedMode === 'audio_only' ? 'Audio Session' : 'Meeting Session Grid'} ${
                        withAudio ? 'with Microphone Audio' : 'without Audio'
                      }`}
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {isPaused ? (
                    <Button
                      onClick={onResumeRecording}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 h-10 px-4 rounded-xl border-none cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </Button>
                  ) : (
                    <Button
                      onClick={onPauseRecording}
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold gap-1.5 h-10 px-4 rounded-xl border-none cursor-pointer"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </Button>
                  )}

                  <Button
                    onClick={onStopRecording}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1.5 h-10 px-4 rounded-xl shadow-lg shadow-rose-600/30 border-none cursor-pointer"
                  >
                    <Square className="w-4 h-4" /> Stop & Export
                  </Button>
                </div>
              </div>
            ) : recordedBlob ? (
              /* Post-Recording Local Download & New Recording Option */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Session Recorded Successfully!</span>
                  </div>

                  {recordedUrl && (
                    <video
                      src={recordedUrl}
                      controls
                      className="w-full aspect-video rounded-xl bg-black border border-white/10"
                    />
                  )}

                  {uploadStatus && (
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl font-semibold text-center animate-in fade-in">
                      {uploadStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => onDownloadLocal()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-emerald-600/20 gap-2 border-none cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      Save File Local
                    </Button>

                    <Button
                      disabled={isUploading}
                      onClick={handleSaveToCloud}
                      className="bg-primary hover:bg-[#004fe6] text-white font-bold text-xs h-10 rounded-xl gap-2 border-none cursor-pointer"
                    >
                      <Cloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                      Upload to Cloud
                    </Button>
                  </div>

                  <Button
                    onClick={onResetRecorder}
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs h-10 rounded-xl gap-2 border-none cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-400" />
                    Discard & Start New Recording
                  </Button>
                </div>

                {/* Subtitle Downloads */}
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
                      <Subtitles className="w-3.5 h-3.5" /> Download .SRT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTranscriptFile(transcriptItems, 'vtt', roomId)}
                      className="flex-1 text-xs border-slate-700 bg-slate-800 text-slate-200 gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download .VTT
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Start Recording Form: Audio Toggle & Mode Choice */
              <div className="space-y-5">
                {/* Audio Option Prompt */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                    Audio Option
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWithAudio(true)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                        withAudio
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <Volume2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold block">Record With Audio</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Captures voice & mic</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setWithAudio(false)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                        !withAudio
                          ? 'bg-amber-600/20 border-amber-500 text-white'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <VolumeX className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold block">Silent Video</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Without Audio</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Session Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                    Session Recording Source
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
                      <span className="text-xs font-semibold block">Meeting Session</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Grid & Speaker</span>
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
                      <span className="text-xs font-semibold block">Display Screen</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Screen share</span>
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
                      <span className="text-[10px] text-slate-400 block mt-0.5">MP3 Audio</span>
                    </button>
                  </div>
                </div>

                {/* Quality Selector */}
                {selectedMode !== 'audio_only' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                      Quality Preset
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
                  onClick={() => onStartRecording(selectedMode, selectedQuality, withAudio)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-11 rounded-2xl shadow-lg shadow-rose-600/30 gap-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  Start Recording Session ({withAudio ? 'With Audio' : 'Silent'})
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
