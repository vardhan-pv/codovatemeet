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
  Palette,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AnnotationTool = 'pen' | 'highlighter' | 'laser' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser'

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

interface ScreenAnnotationLayerProps {
  room: Room | null
  isActive: boolean
  onClose: () => void
  isPresenter: boolean
  senderName: string
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
  const isDrawingRef = useRef<boolean>(false)

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff', '#000000']

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
        } else if (decoded.type === 'ANNOTATION_LASER') {
          setLaserPoint(decoded.point)
          setTimeout(() => setLaserPoint(null), 1000)
        }
      } catch (e) {}
    }
    room.on('dataReceived', handleData)
    return () => {
      room.off('dataReceived', handleData)
    }
  }, [room])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    if (activeTool === 'laser' && e.buttons === 1) {
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

  const handleMouseUp = () => {
    if (!isDrawingRef.current || !currentStroke) return
    isDrawingRef.current = false
    setStrokes((prev) => [...prev, currentStroke])
    broadcastStroke('ANNOTATION_STROKE', { stroke: currentStroke })
    setCurrentStroke(null)
  }

  const handleClear = () => {
    setStrokes([])
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

  if (!isActive) return null

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Interactive Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full pointer-events-auto cursor-crosshair"
      />

      {/* Animated Laser Point Overlay */}
      {laserPoint && (
        <div
          className="absolute w-5 h-5 bg-rose-500 rounded-full blur-sm animate-ping pointer-events-none"
          style={{ left: laserPoint.x - 10, top: laserPoint.y - 10 }}
        />
      )}

      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 text-white"
      >
        {/* Tools */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          <Button
            size="icon"
            variant={activeTool === 'pen' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('pen')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            title="Pencil / Draw"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'highlighter' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('highlighter')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'highlighter' ? 'bg-amber-600 text-white' : 'text-slate-300'}`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'laser' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('laser')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'laser' ? 'bg-rose-600 text-white' : 'text-slate-300'}`}
            title="Laser Pointer"
          >
            <Crosshair className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('rectangle')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'circle' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('circle')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'circle' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'arrow' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('arrow')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'arrow' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            title="Arrow"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('text')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            title="Text"
          >
            <Type className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('eraser')}
            className={`h-8 w-8 rounded-lg ${activeTool === 'eraser' ? 'bg-red-600 text-white' : 'text-slate-300'}`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
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
          <Button
            size="icon"
            variant="ghost"
            onClick={handleUndo}
            className="h-8 w-8 text-slate-300 hover:text-white"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleClear}
            className="h-8 w-8 text-slate-300 hover:text-red-400"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            className="h-8 w-8 text-slate-300 hover:text-white"
            title="Download Screenshot"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Close Annotation Mode"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
