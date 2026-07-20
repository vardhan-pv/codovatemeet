'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  X,
  Gauge,
  Wifi,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Volume2,
  Video,
  VideoOff,
  EyeOff,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { NetworkStats, NetworkOptimizationConfig, AdaptiveMode } from '@/lib/network-adaptive-engine'
import { Button } from '@/components/ui/button'

interface NetworkStatsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: NetworkStats
  config: NetworkOptimizationConfig
  onUpdateConfig: (newCfg: Partial<NetworkOptimizationConfig>) => void
}

export function NetworkStatsModal({
  isOpen,
  onClose,
  stats,
  config,
  onUpdateConfig
}: NetworkStatsModalProps) {
  if (!isOpen) return null

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    if (score >= 65) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    if (score >= 45) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  }

  // Draw real-time history SVG graph
  const renderHistoryGraph = () => {
    if (!stats.history || stats.history.length < 2) {
      return (
        <div className="h-24 flex items-center justify-center text-xs text-slate-500 font-mono">
          Gathering network metrics...
        </div>
      )
    }

    const width = 460
    const height = 70
    const maxBitrate = Math.max(...stats.history.map(h => h.bitrate), 3000)

    const points = stats.history.map((pt, i) => {
      const x = (i / (stats.history.length - 1)) * width
      const y = height - (pt.bitrate / maxBitrate) * (height - 10) - 5
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="w-full bg-slate-900/80 rounded-lg p-3 border border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
          <span>Downlink Bitrate History</span>
          <span className="text-emerald-400">{stats.downlinkKbps} kbps</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
          <defs>
            <linearGradient id="bitrateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-blue-500/5 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  Adaptive Network & Quality Center
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time WebRTC media optimization & bandwidth saver
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
            {/* Score & Tier Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${getScoreColor(stats.score)}`}>
                  {stats.score}/100
                </div>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">
                    Connection Health
                  </span>
                  <span className="text-sm font-semibold text-slate-200 capitalize">
                    {stats.level} Tier ({stats.connectionState})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">
                  Active Resolution
                </span>
                <span className="text-sm font-mono font-semibold text-blue-400">
                  {stats.recommendedResolution} @ {stats.recommendedFps}fps
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[11px] font-mono text-slate-400 block">RTT Latency</span>
                <span className="text-lg font-bold font-mono text-slate-100 mt-0.5 block">
                  {stats.rtt} <span className="text-xs font-normal text-slate-400">ms</span>
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[11px] font-mono text-slate-400 block">Packet Loss</span>
                <span className={`text-lg font-bold font-mono mt-0.5 block ${stats.packetLoss > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {stats.packetLoss}%
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[11px] font-mono text-slate-400 block">Downlink</span>
                <span className="text-lg font-bold font-mono text-blue-400 mt-0.5 block">
                  {stats.downlinkKbps} <span className="text-xs font-normal text-slate-400">kbps</span>
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[11px] font-mono text-slate-400 block">Jitter</span>
                <span className="text-lg font-bold font-mono text-slate-100 mt-0.5 block">
                  {stats.jitter} <span className="text-xs font-normal text-slate-400">ms</span>
                </span>
              </div>
            </div>

            {/* Graph */}
            {renderHistoryGraph()}

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Optimization Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateConfig({ mode: 'auto' })}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    config.mode === 'auto'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <Zap className="w-4 h-4 text-blue-400 mb-2" />
                  <div>
                    <span className="text-xs font-semibold block">Auto Adaptive</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Dynamic 1080p-180p</span>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateConfig({ mode: 'low_bandwidth' })}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    config.mode === 'low_bandwidth'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <Wifi className="w-4 h-4 text-amber-400 mb-2" />
                  <div>
                    <span className="text-xs font-semibold block">Low Bandwidth</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Force 180p Saver</span>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateConfig({ mode: 'audio_only' })}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    config.mode === 'audio_only'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-purple-400 mb-2" />
                  <div>
                    <span className="text-xs font-semibold block">Audio Only</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pause all video</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Smart Feature Toggles */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Intelligent Bandwidth Controls
              </label>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Pause Off-Screen Video Streams
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Saves up to 80% bandwidth by pausing video for off-screen tile scroll
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.pauseOffscreenVideo}
                  onChange={(e) => onUpdateConfig({ pauseOffscreenVideo: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      AI Audio Prioritization & Noise Suppression
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Keeps audio crisp even under 20% packet loss
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.noiseSuppression}
                  onChange={(e) => onUpdateConfig({ noiseSuppression: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Diagnostic Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>WebRTC Codec: VP8 / Opus (Simulcast active)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
