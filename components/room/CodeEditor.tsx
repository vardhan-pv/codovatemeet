'use client'

import React, { useRef, useState, useEffect } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Play, Download, TerminalSquare, X } from 'lucide-react'
import dynamic from 'next/dynamic'
const Terminal = dynamic(() => import('./Terminal').then(m => ({ default: m.Terminal })), { ssr: false })
import type { Terminal as XTerm } from 'xterm'

interface CodeEditorProps {
  code: string
  onCodeChange: (value: string) => void
  room?: any
  lobbyName?: string
  sendData?: (type: string, payload: any) => void
  readOnly?: boolean
}

export function CodeEditor({ code, onCodeChange, room, lobbyName, sendData, readOnly = false }: CodeEditorProps) {
  const [language, setLanguage] = useState('javascript')
  const [showTerminal, setShowTerminal] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const editorRef = useRef<any>(null)
  const xtermRef = useRef<XTerm | null>(null)
  
  // NOTE: In Phase 2 we are just rendering Monaco. 
  // In a future phase, we will connect Yjs + y-monaco over LiveKit data channels for true CRDT sync.
  // For now, we'll do a simple debounced broadcast over LiveKit data channels if available.

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Set a custom dark theme that matches our premium UI
    monaco.editor.defineTheme('codovate-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '16213E' }
      ],
      colors: {
        'editor.background': '#16213E',
        'editor.lineHighlightBackground': '#1E293B',
        'editorLineNumber.foreground': '#475569',
        'editorIndentGuide.background': '#1E293B',
      }
    })
    monaco.editor.setTheme('codovate-dark')
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
      // Basic manual sync for now:
      if (sendData) {
        sendData('CODE_EDIT', { code: value })
      }
    }
  }

  // Listen for incoming code changes
  useEffect(() => {
    if (!room) return
    const handleData = (data: Uint8Array, participant: any) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(data))
        if (decoded.type === 'CODE_EDIT' && decoded.senderSid !== room.localParticipant.sid) {
          onCodeChange(decoded.code)
        }
      } catch (e) {
        // ignore
      }
    }
    room.on('dataReceived', handleData)
    return () => {
      room.off('dataReceived', handleData)
    }
  }, [room])

  // Listen for terminal sync command from admin
  useEffect(() => {
    const handleSync = () => {
      setShowTerminal(true)
      if (xtermRef.current) {
        xtermRef.current.clear()
        xtermRef.current.writeln('\x1b[38;5;240m[Terminal view synced by host]\x1b[0m')
        xtermRef.current.writeln('')
      }
    }
    window.addEventListener('sync_terminal', handleSync)
    return () => window.removeEventListener('sync_terminal', handleSync)
  }, [])

  const runCode = async () => {
    if (!xtermRef.current) {
      setShowTerminal(true)
      // wait for terminal to mount
      setTimeout(runCode, 100)
      return
    }
    const term = xtermRef.current
    setIsExecuting(true)
    term.writeln(`\x1b[1;34m$ codovate run main.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'ts'}\x1b[0m`)
    term.writeln('\x1b[38;5;240mCompiling and starting secure sandbox...\x1b[0m')
    
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      })
      const data = await response.json()
      
      term.writeln('')
      if (data.error) {
        term.writeln(`\x1b[31mError:\x1b[0m ${data.error}`)
      } else {
        const lines = data.output.split('\n')
        lines.forEach((l: string) => term.writeln(l))
      }
      term.writeln(`\n\x1b[38;5;240m[Process exited with code ${data.error ? '1' : '0'}]\x1b[0m\n`)
    } catch (err: any) {
      term.writeln(`\x1b[31mFailed to connect to execution engine.\x1b[0m`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Editor Header */}
      <div className="h-12 bg-popover/80 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <select 
            className="bg-transparent border-none text-xs text-slate-300 font-mono focus:ring-0 cursor-pointer outline-none ml-4"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white" onClick={() => {
            const repo = prompt("Enter GitHub repository (e.g. facebook/react):")
            if (repo) {
              onCodeChange(`// Pulled from ${repo}\n// This is a mock response. In a future phase, we will use the GitHub API.\n\nexport function App() {\n  return <div>Hello GitHub!</div>\n}\n`)
            }
          }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub
          </Button>
          <Button size="sm" variant="ghost" className={`h-7 text-xs rounded-md ${showTerminal ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} onClick={() => setShowTerminal(!showTerminal)}>
            <TerminalSquare className="w-4 h-4 mr-1" /> Terminal
          </Button>
          <Button 
            size="sm" 
            onClick={runCode}
            disabled={isExecuting}
            className="h-7 text-xs rounded-md bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 border border-[#22C55E]/30 font-bold"
          >
            <Play className={`w-3 h-3 mr-1 ${isExecuting ? 'animate-pulse' : ''}`} fill="currentColor" /> {isExecuting ? 'Running...' : 'Run Code'}
          </Button>
        </div>
      </div>
      
      {/* Monaco Editor Container */}
      <div className="flex-1 relative w-full min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark" // Fallback, will be overridden in didMount
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            fontLigatures: true,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            readOnly: readOnly,
          }}
          loading={
            <div className="flex items-center justify-center h-full w-full text-slate-500 font-mono text-sm">
              Loading Live Workspace...
            </div>
          }
        />
      </div>

      {/* Terminal Panel */}
      {showTerminal && (
        <div className="h-64 border-t border-border bg-[#050816] flex flex-col shrink-0 relative animate-in slide-in-from-bottom-10 duration-300">
          <div className="h-8 border-b border-border flex items-center justify-between px-4 bg-popover/50">
            <div className="flex gap-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
                <TerminalSquare className="w-3 h-3" /> Output
              </span>
            </div>
            <button onClick={() => setShowTerminal(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative">
            <Terminal onTerminalReady={(term) => { xtermRef.current = term }} />
          </div>
        </div>
      )}
    </div>
  )
}
