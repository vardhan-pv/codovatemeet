/**
 * Low Bandwidth & Adaptive Network Optimization Engine
 * Codovate Meet
 */

export type NetworkQualityLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
export type AdaptiveMode = 'auto' | 'low_bandwidth' | 'audio_only'

export interface NetworkStatsHistoryPoint {
  timestamp: number
  rtt: number
  bitrate: number
  packetLoss: number
}

export interface NetworkStats {
  rtt: number // ms
  packetLoss: number // percentage (0-100)
  downlinkKbps: number
  uplinkKbps: number
  jitter: number // ms
  score: number // 0-100
  signalBars: number // 1 to 5
  level: NetworkQualityLevel
  recommendedResolution: '1080p' | '720p' | '480p' | '360p' | '180p' | 'audio_only'
  recommendedFps: number
  isAudioOnly: boolean
  simulcastDisabled: boolean
  connectionState: 'connected' | 'reconnecting' | 'disconnected' | 'signal_weak'
  history: NetworkStatsHistoryPoint[]
}

export interface NetworkOptimizationConfig {
  mode: AdaptiveMode
  autoAdapt: boolean
  pauseOffscreenVideo: boolean
  noiseSuppression: boolean
  maxPublishWidth: number
  maxPublishHeight: number
  maxPublishFps: number
}

export class NetworkAdaptiveEngine {
  private stats: NetworkStats = {
    rtt: 35,
    packetLoss: 0.1,
    downlinkKbps: 2500,
    uplinkKbps: 1800,
    jitter: 4,
    score: 95,
    signalBars: 5,
    level: 'EXCELLENT',
    recommendedResolution: '720p',
    recommendedFps: 24,
    isAudioOnly: false,
    simulcastDisabled: false,
    connectionState: 'connected',
    history: []
  }

  private config: NetworkOptimizationConfig = {
    mode: 'auto',
    autoAdapt: true,
    pauseOffscreenVideo: true,
    noiseSuppression: true,
    maxPublishWidth: 1280,
    maxPublishHeight: 720,
    maxPublishFps: 24
  }

  private historyLimit = 20
  private criticalDurationMs = 0
  private lastUpdateTime = Date.now()

  public calculateQualityLevel(rtt: number, loss: number, kbps: number): NetworkQualityLevel {
    if (loss > 15 || rtt > 600 || kbps < 150) {
      return 'CRITICAL'
    } else if (loss > 6 || rtt > 350 || kbps < 400) {
      return 'POOR'
    } else if (loss > 3 || rtt > 180 || kbps < 900) {
      return 'FAIR'
    } else if (loss > 1 || rtt > 90 || kbps < 1800) {
      return 'GOOD'
    }
    return 'EXCELLENT'
  }

  public calculateScore(rtt: number, loss: number, jitter: number): number {
    let score = 100
    if (rtt > 500) score -= 40
    else if (rtt > 250) score -= 25
    else if (rtt > 120) score -= 12
    else if (rtt > 60) score -= 5

    if (loss > 15) score -= 45
    else if (loss > 8) score -= 30
    else if (loss > 3) score -= 18
    else if (loss > 1) score -= 8

    if (jitter > 50) score -= 15
    else if (jitter > 20) score -= 8

    return Math.max(5, Math.min(100, Math.round(score)))
  }

  public calculateSignalBars(score: number): number {
    if (score >= 85) return 5
    if (score >= 70) return 4
    if (score >= 50) return 3
    if (score >= 30) return 2
    return 1
  }

  public getRecommendation(level: NetworkQualityLevel, mode: AdaptiveMode) {
    if (mode === 'audio_only' || level === 'CRITICAL') {
      return { resolution: 'audio_only' as const, fps: 0, isAudioOnly: true, simulcastDisabled: true }
    }
    if (mode === 'low_bandwidth' || level === 'POOR') {
      return { resolution: '180p' as const, fps: 15, isAudioOnly: false, simulcastDisabled: true }
    }

    switch (level) {
      case 'FAIR':
        return { resolution: '360p' as const, fps: 18, isAudioOnly: false, simulcastDisabled: false }
      case 'GOOD':
        return { resolution: '480p' as const, fps: 24, isAudioOnly: false, simulcastDisabled: false }
      case 'EXCELLENT':
      default:
        return { resolution: '720p' as const, fps: 24, isAudioOnly: false, simulcastDisabled: false }
    }
  }

  public updateStats(params: {
    rtt?: number
    packetLoss?: number
    downlinkKbps?: number
    uplinkKbps?: number
    jitter?: number
    connectionState?: NetworkStats['connectionState']
  }): NetworkStats {
    const now = Date.now()
    const delta = now - this.lastUpdateTime
    this.lastUpdateTime = now

    // Exponential moving average for bitrate smoothing (alpha = 0.3)
    const rawDown = params.downlinkKbps ?? this.stats.downlinkKbps
    const rawUp = params.uplinkKbps ?? this.stats.uplinkKbps
    const downKbps = Math.round(0.3 * rawDown + 0.7 * this.stats.downlinkKbps)
    const upKbps = Math.round(0.3 * rawUp + 0.7 * this.stats.uplinkKbps)

    const rtt = params.rtt ?? this.stats.rtt
    const loss = params.packetLoss ?? this.stats.packetLoss
    const jitter = params.jitter ?? this.stats.jitter
    const state = params.connectionState ?? this.stats.connectionState

    const level = this.calculateQualityLevel(rtt, loss, downKbps)
    const score = this.calculateScore(rtt, loss, jitter)
    const signalBars = this.calculateSignalBars(score)

    // Track critical duration for auto audio-only threshold (>10 seconds critical)
    if (level === 'CRITICAL' || level === 'POOR') {
      this.criticalDurationMs += delta
    } else {
      this.criticalDurationMs = Math.max(0, this.criticalDurationMs - delta * 2)
    }

    // Auto adapt mode if autoAdapt is enabled and network is poor for >10s
    let currentMode = this.config.mode
    if (this.config.autoAdapt && this.criticalDurationMs > 10000 && currentMode === 'auto') {
      currentMode = 'low_bandwidth'
    }

    const recommendation = this.getRecommendation(level, currentMode)

    const newHistoryPoint: NetworkStatsHistoryPoint = {
      timestamp: now,
      rtt,
      bitrate: downKbps,
      packetLoss: loss
    }

    const updatedHistory = [...this.stats.history, newHistoryPoint].slice(-this.historyLimit)

    this.stats = {
      rtt,
      packetLoss: loss,
      downlinkKbps: downKbps,
      uplinkKbps: upKbps,
      jitter,
      score,
      signalBars,
      level,
      recommendedResolution: recommendation.resolution,
      recommendedFps: recommendation.fps,
      isAudioOnly: recommendation.isAudioOnly,
      simulcastDisabled: recommendation.simulcastDisabled,
      connectionState: state,
      history: updatedHistory
    }

    return this.stats
  }

  public setConfig(newConfig: Partial<NetworkOptimizationConfig>) {
    this.config = { ...this.config, ...newConfig }
    const recommendation = this.getRecommendation(this.stats.level, this.config.mode)
    this.stats.recommendedResolution = recommendation.resolution
    this.stats.recommendedFps = recommendation.fps
    this.stats.isAudioOnly = recommendation.isAudioOnly
    this.stats.simulcastDisabled = recommendation.simulcastDisabled
  }

  public getConfig(): NetworkOptimizationConfig {
    return { ...this.config }
  }

  public getStats(): NetworkStats {
    return { ...this.stats }
  }
}

export const defaultNetworkEngine = new NetworkAdaptiveEngine()
