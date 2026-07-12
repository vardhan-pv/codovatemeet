'use client'

import React, { useEffect, useState } from 'react'
import { Tldraw } from '@tldraw/tldraw'

interface WhiteboardProps {
  room?: any
  lobbyName?: string
  sendData?: (type: string, payload: any) => void
  readOnly?: boolean
}

export function Whiteboard({ room, lobbyName, sendData, readOnly = false }: WhiteboardProps) {
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    const handleClear = () => {
      if (editor) {
        editor.selectAll()
        editor.deleteShapes(editor.getSelectedShapeIds())
      }
    }
    window.addEventListener('wb_clear', handleClear)
    return () => window.removeEventListener('wb_clear', handleClear)
  }, [editor])

  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly: readOnly })
    }
  }, [editor, readOnly])

  return (
    <div className="flex flex-col h-full bg-[#0B1120] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="h-12 bg-slate-900/80 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
          <span className="text-xl">🎨</span> Advanced Whiteboard
        </div>
        <div className="flex items-center gap-2">
          {readOnly && <span className="text-[10px] uppercase font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">View Only</span>}
          <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded">Live Sync Active</span>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
          <Tldraw 
            onMount={(e) => setEditor(e)}
          />
        </div>
      </div>
    </div>
  )
}
