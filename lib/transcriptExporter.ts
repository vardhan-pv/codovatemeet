/**
 * Subtitle & Transcript Exporter Utility
 * Codovate Meet
 */

export interface TranscriptItem {
  sender: string
  text: string
  startTimeSecs: number
  endTimeSecs: number
}

function formatTimeSRT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  const hh = String(hrs).padStart(2, '0')
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const mmm = String(ms).padStart(3, '0')

  return `${hh}:${mm}:${ss},${mmm}`
}

function formatTimeVTT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  const hh = String(hrs).padStart(2, '0')
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const mmm = String(ms).padStart(3, '0')

  return `${hh}:${mm}:${ss}.${mmm}`
}

export function generateSRT(items: TranscriptItem[]): string {
  if (!items || items.length === 0) return '1\n00:00:00,000 --> 00:00:05,000\n[No speech transcript recorded]\n'

  return items
    .map((item, index) => {
      const num = index + 1
      const start = formatTimeSRT(item.startTimeSecs)
      const end = formatTimeSRT(item.endTimeSecs || item.startTimeSecs + 4)
      return `${num}\n${start} --> ${end}\n${item.sender}: ${item.text}\n`
    })
    .join('\n')
}

export function generateVTT(items: TranscriptItem[]): string {
  let header = 'WEBVTT - Codovate Meet Recording Subtitles\n\n'
  if (!items || items.length === 0) return header + '00:00:00.000 --> 00:00:05.000\n[No speech transcript recorded]\n'

  const body = items
    .map((item, index) => {
      const num = index + 1
      const start = formatTimeVTT(item.startTimeSecs)
      const end = formatTimeVTT(item.endTimeSecs || item.startTimeSecs + 4)
      return `${num}\n${start} --> ${end}\n<v ${item.sender}>${item.text}</v>\n`
    })
    .join('\n')

  return header + body
}

export function exportTranscriptFile(items: TranscriptItem[], format: 'srt' | 'vtt' | 'txt', roomId: string) {
  let content = ''
  let mimeType = 'text/plain'
  let ext = 'txt'

  if (format === 'srt') {
    content = generateSRT(items)
    mimeType = 'application/x-subrip'
    ext = 'srt'
  } else if (format === 'vtt') {
    content = generateVTT(items)
    mimeType = 'text/vtt'
    ext = 'vtt'
  } else {
    content = items.map((i) => `[${formatTimeSRT(i.startTimeSecs)}] ${i.sender}: ${i.text}`).join('\n')
  }

  const filename = `Meeting_Subtitles_${roomId}.${ext}`
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
