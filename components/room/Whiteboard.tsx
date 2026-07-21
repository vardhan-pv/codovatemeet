'use client'

import React, { useEffect, useState } from 'react'
import { Tldraw } from '@tldraw/tldraw'

interface WhiteboardProps {
  room?: any
  lobbyName?: string
  sendData?: (type: string, payload: any) => void
  readOnly?: boolean
  activeWorkspace?: string
  presentedState?: string
}

export function Whiteboard({ room, lobbyName, sendData, readOnly = false, activeWorkspace, presentedState }: WhiteboardProps) {
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    if (activeWorkspace === 'whiteboard' && editor) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [activeWorkspace, editor])

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
      if (!readOnly) {
        ;(window as any).codovateWhiteboardEditor = editor
      }
    }
  }, [editor, readOnly])

  useEffect(() => {
    if (editor && presentedState && readOnly) {
      try {
        editor.store.loadSnapshot(JSON.parse(presentedState))
      } catch (e) {
        console.error("Failed to load whiteboard snapshot", e)
      }
    }
  }, [editor, presentedState, readOnly])

  return (
    <div className="flex flex-col h-full bg-[#0B1120] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="h-12 bg-slate-900/80 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
          <span className="text-xl">🎨</span> Advanced Whiteboard
        </div>
        <div className="flex items-center gap-2">
          {/* Share / Broadcast Workspace Button */}
          <button
            onClick={() => {
              if (sendData) {
                try {
                  const snapshot = editor ? JSON.stringify(editor.store.getSnapshot()) : ''
                  sendData('PRESENT_WORKSPACE', { workspaceType: 'whiteboard', state: snapshot, action: 'start' })
                  alert('📢 You are now presenting your Whiteboard workspace to the room as a live screen share!')
                } catch (e) {
                  sendData('PRESENT_WORKSPACE', { workspaceType: 'whiteboard', action: 'start' })
                  alert('📢 You are now presenting your Whiteboard workspace to the room as a live screen share!')
                }
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow transition active:scale-95 cursor-pointer"
            title="Share & Present Whiteboard workspace to all room participants as a live screen share"
          >
            <span>📢 Share as Screen</span>
          </button>
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
