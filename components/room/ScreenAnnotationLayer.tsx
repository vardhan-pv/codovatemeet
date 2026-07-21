'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Room } from 'livekit-client'
import {
  Pencil,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  Trash2,
  Undo,
  Download,
  Crosshair,
  X,
  StickyNote,
  Minus,
  Plus,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AnnotationTool = 'pen' | 'highlighter' | 'laser' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser' | 'sticky'

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  tool: AnnotationTool
  color: string
  width: number
  points: Point[]
  text?: string
}

interface StickyNoteData {
  id: string
  x: number
  y: number
  text: string
  color: string
  width: number
  height: number
}

interface ScreenAnnotationLayerProps {
  room: Room | null
  isActive: boolean
  onClose: () => void
  isPresenter: boolean
  senderName: string
}

const TOOL_LABELS: Record<AnnotationTool, string> = {
  pen: 'Pencil',
  highlighter: 'Highlighter',
  laser: 'Laser Pointer',
  rectangle: 'Rectangle',
  circle: 'Circle',
  arrow: 'Arrow',
  text: 'Text',
  eraser: 'Eraser',
  sticky: 'Sticky Note'
}

export function ScreenAnnotationLayer({
  room,
  isActive,
  onClose,
  isPresenter,
  senderName
}: ScreenAnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeTool, setActiveTool] = useState<AnnotationTool>('pen')
  const [color, setColor] = useState<string>('#3b82f6')
  const [strokeWidth, setStrokeWidth] = useState<number>(4)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [laserPoint, setLaserPoint] = useState<Point | null>(null)
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([])
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null)
  const [showStrokeWidth, setShowStrokeWidth] = useState(false)
  const isDrawingRef = useRef<boolean>(false)

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff', '#000000']
  const stickyColors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa']

  // Redraw all strokes on canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes

    allStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return
      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.fillStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.4
        ctx.lineWidth = stroke.width * 3
      } else {
        ctx.globalAlpha = 1.0
      }

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
        if (stroke.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.lineWidth = stroke.width * 4
        }
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
      } else if (stroke.tool === 'rectangle' && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const radius = Math.hypot(end.x - start.x, end.y - start.y)
        ctx.beginPath()
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const headlen = 15
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
      } else if (stroke.tool === 'text' && stroke.text) {
        ctx.font = `${stroke.width * 5 + 14}px sans-serif`
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y)
      }

      ctx.restore()
    })
  }, [strokes, currentStroke])

  // Resize canvas to parent container dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const updateSize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
        redraw()
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  // Broadcast annotation stroke over LiveKit data channel
  const broadcastStroke = (type: string, data: any) => {
    if (!room) return
    try {
      const payload = JSON.stringify({ type, sender: senderName, ...data })
      const bytes = new TextEncoder().encode(payload)
      room.localParticipant.publishData(bytes, { reliable: type !== 'ANNOTATION_LASER' })
    } catch (e) {
      console.warn('Failed to publish annotation data:', e)
    }
  }

  // Listen for remote peer annotation events
  useEffect(() => {
    if (!room) return
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(payload))
        if (decoded.type === 'ANNOTATION_STROKE') {
          setStrokes((prev) => [...prev, decoded.stroke])
        } else if (decoded.type === 'ANNOTATION_CLEAR') {
          setStrokes([])
          setStickyNotes([])
        } else if (decoded.type === 'ANNOTATION_LASER') {
          setLaserPoint(decoded.point)
          setTimeout(() => setLaserPoint(null), 1000)
        } else if (decoded.type === 'ANNOTATION_STICKY') {
          setStickyNotes(prev => {
            if (prev.find(n => n.id === decoded.note.id)) return prev
            return [...prev, decoded.note]
          })
        } else if (decoded.type === 'ANNOTATION_STICKY_UPDATE') {
          setStickyNotes(prev => prev.map(n => n.id === decoded.note.id ? decoded.note : n))
        } else if (decoded.type === 'ANNOTATION_STICKY_DELETE') {
          setStickyNotes(prev => prev.filter(n => n.id !== decoded.noteId))
        }
      } catch (e) {}
    }
    room.on('dataReceived', handleData)
    return () => {
      room.off('dataReceived', handleData)
    }
  }, [room])

  const getEventPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }

    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pt = getEventPoint(e)

    if (activeTool === 'laser') {
      setLaserPoint(pt)
      broadcastStroke('ANNOTATION_LASER', { point: pt })
      return
    }

    if (activeTool === 'text') {
      const input = prompt('Enter annotation text:')
      if (input) {
        const textStroke: Stroke = {
          id: Math.random().toString(),
          tool: 'text',
          color,
          width: strokeWidth,
          points: [pt],
          text: input
        }
        setStrokes((prev) => [...prev, textStroke])
        broadcastStroke('ANNOTATION_STROKE', { stroke: textStroke })
      }
      return
    }

    if (activeTool === 'sticky') {
      const noteText = prompt('Enter sticky note text:')
      if (noteText) {
        const note: StickyNoteData = {
          id: Math.random().toString(),
          x: pt.x,
          y: pt.y,
          text: noteText,
          color: stickyColors[Math.floor(Math.random() * stickyColors.length)],
          width: 160,
          height: 100
        }
        setStickyNotes(prev => [...prev, note])
        broadcastStroke('ANNOTATION_STICKY', { note })
      }
      return
    }

    isDrawingRef.current = true
    const newStroke: Stroke = {
      id: Math.random().toString(),
      tool: activeTool,
      color,
      width: strokeWidth,
      points: [pt]
    }
    setCurrentStroke(newStroke)
  }

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pt = getEventPoint(e)

    const isButtonPressed = 'touches' in e ? true : (e as React.MouseEvent).buttons === 1

    if (activeTool === 'laser' && isButtonPressed) {
      setLaserPoint(pt)
      broadcastStroke('ANNOTATION_LASER', { point: pt })
      return
    }

    if (!isDrawingRef.current || !currentStroke) return

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pt] } : null))
    } else {
      // Shape tools: start & end point
      setCurrentStroke((prev) => (prev ? { ...prev, points: [prev.points[0], pt] } : null))
    }
  }

  const handlePointerUp = () => {
    if (!isDrawingRef.current || !currentStroke) return
    isDrawingRef.current = false
    setStrokes((prev) => [...prev, currentStroke])
    broadcastStroke('ANNOTATION_STROKE', { stroke: currentStroke })
    setCurrentStroke(null)
  }

  const handleClear = () => {
    setStrokes([])
    setStickyNotes([])
    broadcastStroke('ANNOTATION_CLEAR', {})
  }

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1))
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Screen_Annotation_${Date.now()}.png`
    link.href = image
    link.click()
  }

  const handleDeleteSticky = (noteId: string) => {
    setStickyNotes(prev => prev.filter(n => n.id !== noteId))
    broadcastStroke('ANNOTATION_STICKY_DELETE', { noteId })
  }

  const handleUpdateSticky = (noteId: string, text: string) => {
    setStickyNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n
      const updated = { ...n, text }
      broadcastStroke('ANNOTATION_STICKY_UPDATE', { note: updated })
      return updated
    }))
    setEditingStickyId(null)
  }

  if (!isActive) return null

  const toolButtons: { tool: AnnotationTool; icon: any; activeColor: string }[] = [
    { tool: 'pen', icon: Pencil, activeColor: 'bg-blue-600' },
    { tool: 'highlighter', icon: Highlighter, activeColor: 'bg-amber-600' },
    { tool: 'laser', icon: Crosshair, activeColor: 'bg-rose-600' },
    { tool: 'rectangle', icon: Square, activeColor: 'bg-blue-600' },
    { tool: 'circle', icon: Circle, activeColor: 'bg-blue-600' },
    { tool: 'arrow', icon: ArrowRight, activeColor: 'bg-blue-600' },
    { tool: 'text', icon: Type, activeColor: 'bg-blue-600' },
    { tool: 'sticky', icon: StickyNote, activeColor: 'bg-yellow-600' },
    { tool: 'eraser', icon: Eraser, activeColor: 'bg-red-600' }
  ]

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Interactive Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full pointer-events-auto cursor-crosshair touch-none"
      />

      {/* Animated Laser Point Overlay */}
      {laserPoint && (
        <div
          className="absolute w-5 h-5 bg-rose-500 rounded-full blur-sm animate-ping pointer-events-none"
          style={{ left: laserPoint.x - 10, top: laserPoint.y - 10 }}
        />
      )}

      {/* Sticky Notes */}
      {stickyNotes.map(note => (
        <div
          key={note.id}
          className="absolute pointer-events-auto shadow-xl rounded-lg overflow-hidden group"
          style={{
            left: note.x,
            top: note.y,
            width: note.width,
            minHeight: note.height
          }}
        >
          <div
            className="w-full h-full p-2 text-xs text-slate-900 font-medium leading-relaxed relative"
            style={{ backgroundColor: note.color }}
          >
            {/* Delete button */}
            <button
              onClick={() => handleDeleteSticky(note.id)}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/20 text-black/60 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-2.5 h-2.5" />
            </button>

            {editingStickyId === note.id ? (
              <textarea
                autoFocus
                defaultValue={note.text}
                onBlur={(e) => handleUpdateSticky(note.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleUpdateSticky(note.id, (e.target as HTMLTextAreaElement).value)
                  }
                }}
                className="w-full h-full bg-transparent resize-none outline-none text-xs"
              />
            ) : (
              <div
                className="cursor-pointer min-h-[60px]"
                onClick={() => setEditingStickyId(note.id)}
              >
                {note.text}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 text-white"
      >
        {/* Tools */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          {toolButtons.map(({ tool, icon: Icon, activeColor }) => (
            <div key={tool} className="relative group">
              <Button
                size="icon"
                variant={activeTool === tool ? 'default' : 'ghost'}
                onClick={() => setActiveTool(tool)}
                className={`h-8 w-8 rounded-lg ${activeTool === tool ? `${activeColor} text-white` : 'text-slate-300'}`}
              >
                <Icon className="w-4 h-4" />
              </Button>
              {/* Tool label tooltip */}
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                {TOOL_LABELS[tool]}
              </span>
            </div>
          ))}
        </div>

        {/* Stroke Width Selector */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 relative">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowStrokeWidth(!showStrokeWidth)}
            className="h-8 w-8 rounded-lg text-slate-300 hover:text-white"
            title="Stroke Width"
          >
            <GripVertical className="w-4 h-4" />
          </Button>

          {showStrokeWidth && (
            <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl flex items-center gap-2 z-20">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
                className="h-6 w-6 text-slate-400"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 6, 8, 12].map(w => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`rounded-full transition ${strokeWidth === w ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-white/30'}`}
                    style={{
                      width: Math.max(8, w * 2),
                      height: Math.max(8, w * 2),
                      backgroundColor: color
                    }}
                  />
                ))}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
                className="h-6 w-6 text-slate-400"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <span className="text-[10px] font-mono text-slate-400 ml-1">{strokeWidth}px</span>
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border border-white/20 transition-transform ${
                color === c ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleUndo}
              className="h-8 w-8 text-slate-300 hover:text-white"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">Undo</span>
          </div>

          <div className="relative group">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClear}
              className="h-8 w-8 text-slate-300 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">Clear All</span>
          </div>

          <div className="relative group">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDownload}
              className="h-8 w-8 text-slate-300 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">Save</span>
          </div>

          <div className="relative group">
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">Close</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
