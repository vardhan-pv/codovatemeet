'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Signal, Zap, AlertTriangle, ShieldCheck, RefreshCw, X, Radio } from 'lucide-react'
import { NetworkStats, NetworkOptimizationConfig, AdaptiveMode } from '@/lib/network-adaptive-engine'
import { Button } from '@/components/ui/button'

interface NetworkSignalBadgeProps {
  stats: NetworkStats
  config: NetworkOptimizationConfig
  onOpenModal: () => void
  onToggleMode: (mode: AdaptiveMode) => void
}

export function NetworkSignalBadge({ stats, config, onOpenModal, onToggleMode }: NetworkSignalBadgeProps) {
  const getBadgeColor = () => {
    if (stats.connectionState === 'reconnecting') return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
    switch (stats.level) {
      case 'EXCELLENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
      case 'GOOD':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
      case 'FAIR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
      case 'POOR':
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const getSignalBars = () => {
    let filled = 4
    if (stats.level === 'GOOD') filled = 3
    else if (stats.level === 'FAIR') filled = 2
    else if (stats.level === 'POOR' || stats.level === 'CRITICAL') filled = 1

    return (
      <div className="flex items-end space-x-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => {
          const isFilled = bar <= filled
          return (
            <div
              key={bar}
              className={`w-0.5 rounded-full transition-all duration-300 ${
                isFilled
                  ? stats.level === 'EXCELLENT'
                    ? 'bg-emerald-400'
                    : stats.level === 'GOOD'
                    ? 'bg-blue-400'
                    : stats.level === 'FAIR'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                  : 'bg-slate-700/60'
              }`}
              style={{ height: `${bar * 25}%` }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onOpenModal}
        title={`Network Health: ${stats.level} (${stats.rtt}ms RTT, ${stats.packetLoss}% Loss)`}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono tracking-tight transition-all duration-200 shadow-sm ${getBadgeColor()}`}
      >
        {stats.connectionState === 'reconnecting' ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          getSignalBars()
        )}

        <span className="font-semibold capitalize">
          {stats.connectionState === 'reconnecting'
            ? 'Reconnecting'
            : config.mode === 'audio_only'
            ? 'Audio Mode'
            : config.mode === 'low_bandwidth'
            ? 'Low BW'
            : stats.recommendedResolution}
        </span>

        <span className="hidden sm:inline-block text-[10px] opacity-75 border-l border-white/10 pl-1.5">
          {stats.rtt}ms
        </span>
      </button>

      {/* Quick mode switcher menu */}
      {config.mode !== 'auto' && (
        <button
          onClick={() => onToggleMode('auto')}
          className="text-[10px] font-sans bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30 flex items-center gap-1 transition"
          title="Return to Auto Adaptive Mode"
        >
          <Zap className="w-3 h-3" />
          Auto
        </button>
      )}
    </div>
  )
}

interface NetworkAlertBannerProps {
  message: string | null
  onDismiss: () => void
  onOpenModal: () => void
  onEnableLowBandwidth: () => void
}

export function NetworkAlertBanner({
  message,
  onDismiss,
  onOpenModal,
  onEnableLowBandwidth
}: NetworkAlertBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-xl bg-slate-950/90 backdrop-blur-md border border-amber-500/40 rounded-xl p-3.5 shadow-2xl shadow-amber-500/10 text-slate-100 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Adaptive Network Alert
              </p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenModal}
              className="text-[11px] h-7 px-2.5 border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200"
            >
              Stats
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
