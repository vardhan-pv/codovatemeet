'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type RecordingMode = 'full_meeting' | 'screen_share' | 'audio_only'
export type RecordingQuality = '1080p' | '720p' | '480p' | 'mp3'

export interface MeetingRecorderOptions {
  mode?: RecordingMode
  quality?: RecordingQuality
  withAudio?: boolean
  onStart?: () => void
  onStop?: (blob: Blob, url: string) => void
  onError?: (err: Error) => void
}

export function useMeetingRecorder(options: MeetingRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTimeSecs, setRecordingTimeSecs] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<RecordingMode>(options.mode || 'full_meeting')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Reset recorder state for starting a fresh recording
  const resetRecorder = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTimeSecs(0)
    chunksRef.current = []
  }, [recordedUrl])

  // Start recording stream with audio toggle & mode choice
  const startRecording = useCallback(
    async (
      mode: RecordingMode = 'full_meeting',
      quality: RecordingQuality = '720p',
      withAudio: boolean = true
    ) => {
      try {
        chunksRef.current = []
        setActiveMode(mode)
        let combinedStream: MediaStream

        if (mode === 'audio_only') {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          combinedStream = audioStream
        } else if (mode === 'screen_share') {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: 'monitor' },
            audio: withAudio
          })

          if (withAudio) {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null)
            if (micStream && micStream.getAudioTracks().length > 0) {
              combinedStream = new MediaStream([
                ...displayStream.getVideoTracks(),
                ...displayStream.getAudioTracks(),
                ...micStream.getAudioTracks()
              ])
            } else {
              combinedStream = displayStream
            }
          } else {
            // Video only without audio tracks
            combinedStream = new MediaStream([...displayStream.getVideoTracks()])
          }
        } else {
          // Full meeting session mode: capture camera/video grid + audio
          const constraints: MediaStreamConstraints = {
            video: {
              width: quality === '1080p' ? 1920 : quality === '720p' ? 1280 : 854,
              height: quality === '1080p' ? 1080 : quality === '720p' ? 720 : 480,
              frameRate: 24
            },
            audio: withAudio
          }

          const cameraStream = await navigator.mediaDevices
            .getUserMedia(constraints)
            .catch(async () => {
              return await navigator.mediaDevices.getDisplayMedia({ video: true, audio: withAudio })
            })

          if (!withAudio) {
            combinedStream = new MediaStream([...cameraStream.getVideoTracks()])
          } else {
            combinedStream = cameraStream
          }
        }

        streamRef.current = combinedStream

        // Determine MIME type supported by browser
        let mimeType = 'video/webm;codecs=vp9,opus'
        if (mode === 'audio_only') {
          mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/mp4'
        } else if (!withAudio) {
          mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/mp4'
        } else if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/mp4')
            ? 'video/mp4'
            : ''
        }

        const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined)

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mode === 'audio_only' ? 'audio/webm' : 'video/webm'
          })
          const url = URL.createObjectURL(blob)
          setRecordedBlob(blob)
          setRecordedUrl(url)
          setIsRecording(false)
          setIsPaused(false)

          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

          // Stop all media tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }

          if (options.onStop) options.onStop(blob, url)
        }

        recorder.start(1000)
        mediaRecorderRef.current = recorder

        setIsRecording(true)
        setIsPaused(false)
        setRecordingTimeSecs(0)

        timerIntervalRef.current = setInterval(() => {
          setRecordingTimeSecs((prev) => prev + 1)
        }, 1000)

        if (options.onStart) options.onStart()
      } catch (err: any) {
        console.error('Failed to start recording:', err)
        if (options.onError) options.onError(err)
      }
    },
    [options]
  )

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimeSecs((prev) => prev + 1)
      }, 1000)
    }
  }, [])

  // Trigger instant local file download to user's machine
  const downloadRecording = useCallback(
    (filename?: string) => {
      if (!recordedBlob) return

      const ext = activeMode === 'audio_only' ? 'mp3' : 'webm'
      const name = filename || `Codovate_Meeting_Recording_${Date.now()}.${ext}`

      const link = document.createElement('a')
      link.href = URL.createObjectURL(recordedBlob)
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [recordedBlob, activeMode]
  )

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    isRecording,
    isPaused,
    recordingTimeSecs,
    recordedBlob,
    recordedUrl,
    activeMode,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecorder
  }
}
