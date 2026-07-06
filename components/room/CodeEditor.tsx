'use client'

import React, { useRef, useState, useEffect } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Play, Download, TerminalSquare, X, Search, FileCode, MessageSquare, ChevronRight, CornerDownRight, Sparkles } from 'lucide-react'
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
  // Parse serialized files JSON or fallback to default single-file structure
  let files: { [filename: string]: { code: string, language: string } } = {
    'index.html': { 
      code: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Codovate Preview</title>\n</head>\n<body>\n  <h1>⚡ Live Preview Active!</h1>\n  <p>Edit index.html, style.css, or script.js in real-time.</p>\n  <button onclick="greet()">Click Me</button>\n</body>\n</html>`, 
      language: 'html' 
    },
    'style.css': {
      code: `body {\n  background: #0f172a;\n  color: #f8fafc;\n  font-family: system-ui, sans-serif;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 90vh;\n  margin: 0;\n}\nh1 {\n  color: #38bdf8;\n  margin-bottom: 8px;\n}\nbutton {\n  background: #38bdf8;\n  color: #0f172a;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-weight: bold;\n  cursor: pointer;\n  margin-top: 16px;\n  transition: opacity 0.2s;\n}\nbutton:hover {\n  opacity: 0.9;\n}`,
      language: 'css'
    },
    'script.js': {
      code: `function greet() {\n  alert("Hello from script.js inside VS Code sandbox!");\n}`,
      language: 'javascript'
    }
  }
  try {
    if (code && code.trim().startsWith('{')) {
      files = JSON.parse(code)
    } else if (code && code !== '// Write live collaborative code here\nconsole.log("Welcome developers!");') {
      files = {
        'main.js': { code: code, language: 'javascript' }
      }
    }
  } catch (e) {
    // fallback
  }

  const fileKeys = Object.keys(files)
  const [activeFile, setActiveFile] = useState(fileKeys[0] || 'index.html')
  const currentFile = fileKeys.includes(activeFile) ? activeFile : (fileKeys[0] || 'index.html')
  const activeFileInfo = files[currentFile] || { code: '', language: 'javascript' }

  const [showExplorer, setShowExplorer] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'search' | 'comments'>('explorer')
  const [showPreview, setShowPreview] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowExplorer(false)
      setShowPreview(false)
      setShowTerminal(false)
    }
  }, [])
  const [isExecuting, setIsExecuting] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [comments, setComments] = useState<{ id: string, filename: string, line: number, text: string, author: string, time: string }[]>([])
  const [peerCursors, setPeerCursors] = useState<{ [senderSid: string]: { filename: string, lineNumber: number, column: number, username: string } }>({})
  const [decorations, setDecorations] = useState<string[]>([])
  
  const editorRef = useRef<any>(null)
  const xtermRef = useRef<XTerm | null>(null)

  // Auto-generate preview content
  useEffect(() => {
    const htmlFile = files['index.html'] || Object.values(files).find(f => f.language === 'html')
    if (!htmlFile) {
      setPreviewContent(`
        <div style="background: #111827; color: #9ca3af; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
          <div>
            <h3>No HTML File Found</h3>
            <p style="font-size: 12px;">Create an <strong>index.html</strong> file to enable real-time Live Preview.</p>
          </div>
        </div>
      `)
      return
    }

    let compiledHtml = htmlFile.code

    // Inject CSS
    let cssStyles = ''
    Object.keys(files).forEach(name => {
      if (files[name].language === 'css') {
        cssStyles += `\n/* ${name} */\n${files[name].code}\n`
      }
    })
    if (cssStyles) {
      compiledHtml = compiledHtml.replace('</head>', `<style>${cssStyles}</style></head>`)
      if (!compiledHtml.includes('</head>')) {
        compiledHtml += `<style>${cssStyles}</style>`
      }
    }

    // Inject JS
    let jsScripts = ''
    Object.keys(files).forEach(name => {
      if (files[name].language === 'javascript' && name !== 'main.js') {
        jsScripts += `\n// ${name}\n${files[name].code}\n`
      }
    })
    if (jsScripts) {
      compiledHtml = compiledHtml.replace('</body>', `<script>${jsScripts}</script></body>`)
      if (!compiledHtml.includes('</body>')) {
        compiledHtml += `<script>${jsScripts}</script>`
      }
    }

    setPreviewContent(compiledHtml)
  }, [code, files])

  // Track & Render Peer Cursors
  useEffect(() => {
    if (!editorRef.current) return
    const monaco = (window as any).monaco
    if (!monaco) return

    const newDecorations: any[] = []
    Object.keys(peerCursors).forEach(sid => {
      const cur = peerCursors[sid]
      if (cur.filename === currentFile) {
        newDecorations.push({
          range: new monaco.Range(cur.lineNumber, cur.column, cur.lineNumber, cur.column + 1),
          options: {
            className: 'border-l-2 border-[#ff007f] h-full animate-pulse',
            glyphMarginClassName: 'text-[9px] text-[#ff007f]',
            hoverMessage: { value: `**${cur.username}** is editing here.` }
          }
        })
      }
    })

    const oldDecs = decorations
    const updatedDecs = editorRef.current.deltaDecorations(oldDecs, newDecorations)
    setDecorations(updatedDecs)
  }, [peerCursors, currentFile])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Set a custom VS Code dark theme
    monaco.editor.defineTheme('vscode-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '1e1e1e' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'regexp', foreground: 'd16969' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'class', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    })
    monaco.editor.setTheme('vscode-dark-theme')

    // Capture cursor changes
    editor.onDidChangeCursorPosition((e: any) => {
      if (sendData) {
        sendData('CURSOR_MOVE', {
          filename: currentFile,
          lineNumber: e.position.lineNumber,
          column: e.position.column,
          username: lobbyName || 'Peer'
        })
      }
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setAutoSaveStatus('saving')
      const updatedFiles = {
        ...files,
        [currentFile]: {
          ...files[currentFile],
          code: value
        }
      }
      onCodeChange(JSON.stringify(updatedFiles))
      if (sendData) {
        sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
      }
      setTimeout(() => setAutoSaveStatus('saved'), 600)
    }
  }

  // Listen for incoming code, cursor, and comment changes
  useEffect(() => {
    if (!room) return
    const handleData = (data: Uint8Array, participant: any) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(data))
        if (decoded.type === 'CODE_EDIT' && decoded.senderSid !== room.localParticipant.sid) {
          onCodeChange(decoded.code)
        } else if (decoded.type === 'CURSOR_MOVE' && decoded.senderSid !== room.localParticipant.sid) {
          setPeerCursors(prev => ({
            ...prev,
            [decoded.senderSid]: decoded.payload
          }))
        } else if (decoded.type === 'COMMENT_ADD') {
          setComments(prev => [...prev, decoded.payload])
        } else if (decoded.type === 'COMMENT_DELETE') {
          setComments(prev => prev.filter(c => c.id !== decoded.payload.id))
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
      setTimeout(runCode, 100)
      return
    }
    const term = xtermRef.current
    setIsExecuting(true)
    term.writeln(`\x1b[1;34m$ codovate run ${currentFile}\x1b[0m`)
    term.writeln('\x1b[38;5;240mCompiling and starting secure sandbox...\x1b[0m')
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: activeFileInfo.language, code: activeFileInfo.code })
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

  const handleCreateFile = () => {
    const filename = prompt("Enter new filename (e.g. index.py, style.css, app.ts):")
    if (!filename) return
    if (files[filename]) {
      alert("File already exists!")
      return
    }
    
    const ext = filename.split('.').pop() || 'js'
    let fileLang = 'javascript'
    if (ext === 'ts') fileLang = 'typescript'
    else if (ext === 'py') fileLang = 'python'
    else if (ext === 'html') fileLang = 'html'
    else if (ext === 'css') fileLang = 'css'
    
    const newFileCode = fileLang === 'html' 
      ? `<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`
      : fileLang === 'python'
        ? `print("Hello from python file ${filename}!")`
        : `console.log("Hello from ${filename}!");`

    const updatedFiles = {
      ...files,
      [filename]: {
        code: newFileCode,
        language: fileLang
      }
    }
    setActiveFile(filename)
    onCodeChange(JSON.stringify(updatedFiles))
    if (sendData) {
      sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
    }
  }

  const handleDeleteFile = (fname: string) => {
    const updatedFiles = { ...files }
    delete updatedFiles[fname]
    const keys = Object.keys(updatedFiles)
    setActiveFile(keys[0] || 'index.html')
    onCodeChange(JSON.stringify(updatedFiles))
    if (sendData) {
      sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
    }
  }

  const getSearchResults = () => {
    if (!searchQuery.trim()) return []
    const results: { filename: string, line: number, text: string }[] = []
    Object.keys(files).forEach(filename => {
      const lines = files[filename].code.split('\n')
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            filename,
            line: idx + 1,
            text: lineText.trim()
          })
        }
      })
    })
    return results
  }

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return
    const updatedFiles = { ...files }
    let changed = false
    Object.keys(updatedFiles).forEach(filename => {
      const originalCode = updatedFiles[filename].code
      if (originalCode.includes(searchQuery)) {
        updatedFiles[filename].code = originalCode.replaceAll(searchQuery, replaceQuery)
        changed = true
      }
    })
    if (changed) {
      onCodeChange(JSON.stringify(updatedFiles))
      if (sendData) {
        sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
      }
      alert(`Replaced all occurrences of "${searchQuery}" with "${replaceQuery}"!`)
      setSearchQuery('')
      setReplaceQuery('')
    }
  }

  const handleAddComment = () => {
    const pos = editorRef.current ? editorRef.current.getPosition() : { lineNumber: 1 }
    const text = prompt(`Add a code review comment for ${currentFile} at line ${pos.lineNumber}:`)
    if (!text) return
    const newComment = {
      id: Math.random().toString(36).substring(7),
      filename: currentFile,
      line: pos.lineNumber,
      text,
      author: lobbyName || 'Reviewer',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setComments(prev => [...prev, newComment])
    if (sendData) {
      sendData('COMMENT_ADD', newComment)
    }
  }

  const handleDeleteComment = (cid: string) => {
    setComments(prev => prev.filter(c => c.id !== cid))
    if (sendData) {
      sendData('COMMENT_DELETE', { id: cid })
    }
  }

  const searchResults = getSearchResults()

  return (
    <div className="flex flex-col h-full bg-card rounded-[20px] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Editor Header */}
      <div className="h-12 bg-popover/80 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          <Button size="sm" variant="ghost" className={`h-7 text-xs rounded-md ml-1 sm:ml-4 px-2 sm:px-3 ${showExplorer ? 'bg-primary/20 text-primary animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} onClick={() => setShowExplorer(!showExplorer)}>
            <span className="hidden sm:inline">📂 Activity Bar</span>
            <span className="sm:hidden">📂</span>
          </Button>

          <select 
            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300 font-mono focus:ring-0 cursor-pointer outline-none ml-1 sm:ml-2"
            value={activeFileInfo.language}
            onChange={(e) => {
              const updatedFiles = {
                ...files,
                [currentFile]: {
                  ...files[currentFile],
                  language: e.target.value
                }
              }
              onCodeChange(JSON.stringify(updatedFiles))
              if (sendData) {
                sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
              }
            }}
          >
            <option value="javascript" className="bg-[#1e1e1e] text-slate-200">JavaScript</option>
            <option value="typescript" className="bg-[#1e1e1e] text-slate-200">TypeScript</option>
            <option value="python" className="bg-[#1e1e1e] text-slate-200">Python</option>
            <option value="html" className="bg-[#1e1e1e] text-slate-200">HTML</option>
            <option value="css" className="bg-[#1e1e1e] text-slate-200">CSS</option>
          </select>

          {/* Auto Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold select-none ml-1 sm:ml-4" title={autoSaveStatus === 'saved' ? 'Synced & Saved' : 'Saving...'}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span className="hidden sm:inline">{autoSaveStatus === 'saved' ? 'Synced & Saved' : 'Saving...'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button size="sm" variant="ghost" className={`h-7 text-xs rounded-md px-2 sm:px-3 ${showPreview ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setShowPreview(!showPreview)}>
            <span className="hidden sm:inline">👁️ Preview</span>
            <span className="sm:hidden">👁️</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white hidden sm:flex" onClick={() => {
            const repo = prompt("Enter GitHub repository (e.g. facebook/react):")
            if (repo) {
              onCodeChange(`// Pulled from ${repo}\n// This is a mock response. In a future phase, we will use the GitHub API.\n\nexport function App() {\n  return <div>Hello GitHub!</div>\n}\n`)
            }
          }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub
          </Button>
          <Button size="sm" variant="ghost" className={`h-7 text-xs rounded-md px-2 sm:px-3 ${showTerminal ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} onClick={() => setShowTerminal(!showTerminal)}>
            <TerminalSquare className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Terminal</span>
          </Button>
          <Button 
            size="sm" 
            onClick={runCode}
            disabled={isExecuting}
            className="h-7 text-xs rounded-md bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 border border-[#22C55E]/30 font-bold px-2 sm:px-3"
          >
            <Play className={`w-3.5 h-3.5 sm:mr-1 ${isExecuting ? 'animate-pulse' : ''}`} fill="currentColor" />
            <span className="hidden sm:inline">{isExecuting ? 'Running...' : 'Run Code'}</span>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* VS Code Left Activity Bar & Sidebar wrapper */}
        {showExplorer && (
          <div className="flex h-full shrink-0 border-r border-[#252526]">
            {/* Activity Bar icons column */}
            <div className="w-12 bg-[#1e1e1f] flex flex-col items-center py-2 gap-3 border-r border-[#252526] select-none shrink-0">
              <button 
                onClick={() => setSidebarTab('explorer')}
                className={`p-2 transition-all ${sidebarTab === 'explorer' ? 'text-white border-l-2 border-l-[#007acc]' : 'text-slate-500 hover:text-slate-350'}`}
                title="File Explorer"
              >
                <FileCode className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSidebarTab('search')}
                className={`p-2 transition-all ${sidebarTab === 'search' ? 'text-white border-l-2 border-l-[#007acc]' : 'text-slate-500 hover:text-slate-350'}`}
                title="Search & Replace"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSidebarTab('comments')}
                className={`p-2 transition-all ${sidebarTab === 'comments' ? 'text-white border-l-2 border-l-[#007acc]' : 'text-slate-500 hover:text-slate-350'}`}
                title="Code Review Comments"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle_ai_sidebar'))}
                className="p-2 transition-all text-slate-500 hover:text-slate-300"
                title="Codovate AI Assistant"
              >
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </button>
            </div>

            {/* Sidebar pane */}
            <aside className="w-48 bg-[#181818] flex flex-col select-none shrink-0 font-mono text-[11px] text-[#c5c5c5]">
              {sidebarTab === 'explorer' ? (
                <>
                  <div className="p-3 border-b border-[#252526] flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider">
                    <span>Explorer</span>
                    <button 
                      onClick={handleCreateFile} 
                      className="hover:text-white font-bold text-sm bg-transparent border-none outline-none cursor-pointer"
                      title="New File"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1">
                    {fileKeys.map(fname => {
                      const fileInfo = files[fname] || { language: 'javascript' }
                      const fileLang = fileInfo.language
                      const isSelected = fname === currentFile
                      return (
                        <div
                          key={fname}
                          onClick={() => {
                            setActiveFile(fname)
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setShowExplorer(false)
                            }
                          }}
                          className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition ${
                            isSelected ? 'bg-[#37373d] text-white font-semibold' : 'hover:bg-[#2a2d2e] text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[9px] font-bold ${
                              fileLang === 'javascript' ? 'text-yellow-500' :
                              fileLang === 'typescript' ? 'text-blue-400' :
                              fileLang === 'python' ? 'text-green-400' :
                              fileLang === 'html' ? 'text-orange-500' : 'text-teal-400'
                            }`}>
                              {fileLang === 'javascript' ? 'JS' :
                               fileLang === 'typescript' ? 'TS' :
                               fileLang === 'python' ? 'PY' :
                               fileLang === 'html' ? '5' : 'CSS'}
                            </span>
                            <span className="truncate">{fname}</span>
                          </div>
                          {fileKeys.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFile(fname)
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 text-[10px] ml-1 bg-transparent border-none cursor-pointer"
                              title="Delete File"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : sidebarTab === 'search' ? (
                <div className="flex flex-col h-full p-3 space-y-3">
                  <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Search & Replace</div>
                  
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Search query..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 text-white rounded outline-none focus:border-[#007acc] text-[10px]"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Replace with..."
                      value={replaceQuery}
                      onChange={e => setReplaceQuery(e.target.value)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 text-white rounded outline-none focus:border-[#007acc] text-[10px]"
                    />
                  </div>

                  {searchQuery.trim() && (
                    <Button 
                      onClick={handleReplaceAll}
                      size="sm"
                      className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white h-7 text-[10px] rounded"
                    >
                      Replace All
                    </Button>
                  )}

                  <div className="flex-1 min-h-0 flex flex-col pt-2 border-t border-[#252526]">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Results ({searchResults.length})</span>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {searchResults.map((res, index) => (
                        <div 
                          key={index}
                          onClick={() => {
                            setActiveFile(res.filename)
                          }}
                          className="p-1.5 rounded bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 cursor-pointer text-[9px] group transition"
                        >
                          <div className="flex justify-between items-center text-slate-300 font-bold mb-0.5">
                            <span className="truncate flex items-center gap-1 text-[#007acc]"><ChevronRight className="w-2.5 h-2.5 shrink-0" /> {res.filename}</span>
                            <span className="text-slate-500 font-normal">L{res.line}</span>
                          </div>
                          <p className="text-slate-400 font-mono truncate leading-none italic">{res.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full p-3 space-y-3">
                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider mb-1">
                    <span>Comments</span>
                    <button 
                      onClick={handleAddComment} 
                      className="hover:text-white font-bold text-xs bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                      title="Add Comment at cursor"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Code Reviews ({comments.length})</span>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {comments.map((c) => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setActiveFile(c.filename)
                            if (editorRef.current) {
                              editorRef.current.revealLineInCenter(c.line)
                              editorRef.current.setPosition({ lineNumber: c.line, column: 1 })
                              editorRef.current.focus()
                            }
                          }}
                          className="p-2 rounded bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 cursor-pointer text-[9px] group transition flex flex-col gap-1"
                        >
                          <div className="flex justify-between items-center text-slate-300 font-bold">
                            <span className="truncate flex items-center gap-1 text-emerald-400"><MessageSquare className="w-2.5 h-2.5 shrink-0" /> {c.author}</span>
                            <span className="text-slate-500 font-normal text-[8px]">{c.time}</span>
                          </div>
                          <div className="text-slate-400 text-[8px] flex items-center gap-1">
                            <CornerDownRight className="w-2 h-2 text-slate-600" /> {c.filename} : Line {c.line}
                          </div>
                          <p className="text-slate-200 font-sans mt-0.5 whitespace-pre-wrap">{c.text}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteComment(c.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 self-end text-red-500 hover:text-red-400 transition text-[8px] bg-transparent border-none cursor-pointer mt-0.5"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* VS Code Tab Bar */}
          <div className="h-9 bg-[#181818] flex items-center select-none text-[11px] font-mono text-[#858585] border-b border-[#252526] shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {fileKeys.map(fname => {
              const fileInfo = files[fname] || { language: 'javascript' }
              const fileLang = fileInfo.language
              const isSelected = fname === currentFile
              return (
                <div
                  key={fname}
                  onClick={() => {
                    setActiveFile(fname)
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setShowExplorer(false)
                    }
                  }}
                  className={`flex items-center px-4 h-full border-r border-[#252526] text-[#c5c5c5] gap-2 cursor-pointer transition shrink-0 ${
                    isSelected 
                      ? 'bg-[#1e1e1e] border-t-2 border-t-[#007acc] text-white font-bold' 
                      : 'bg-[#181818] hover:bg-[#2b2b2b] text-[#858585]'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${
                    fileLang === 'javascript' ? 'text-yellow-500' :
                    fileLang === 'typescript' ? 'text-blue-400' :
                    fileLang === 'python' ? 'text-green-400' :
                    fileLang === 'html' ? 'text-orange-500' : 'text-teal-400'
                  }`}>
                    {fileLang === 'javascript' ? 'JS' :
                     fileLang === 'typescript' ? 'TS' :
                     fileLang === 'python' ? 'PY' :
                     fileLang === 'html' ? '5' : 'CSS'}
                  </span>
                  <span>{fname}</span>
                  {fileKeys.length > 1 && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(fname)
                      }}
                      className="ml-2 hover:bg-[#313132] rounded px-1 text-[9px] hover:text-[#c5c5c5] flex items-center justify-center w-3 h-3 transition"
                    >
                      ×
                    </span>
                  )}
                </div>
              )
            })}

            <button
              onClick={handleCreateFile}
              className="px-3 h-full hover:bg-[#2b2b2b] text-slate-400 hover:text-white flex items-center border-r border-[#252526] transition font-bold text-sm shrink-0"
              title="Create New File"
            >
              +
            </button>
            <div className="flex-grow bg-[#181818] h-full" />
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative w-full min-h-0">
            <Editor
              height="100%"
              language={activeFileInfo.language}
              value={activeFileInfo.code}
              theme="vs-dark" // Fallback, will be overridden in didMount
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                fontLigatures: true,
                padding: { top: 8 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: 'on',
                formatOnPaste: true,
                readOnly: readOnly,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                automaticLayout: true,
                wordWrap: 'on',
                renderLineHighlight: 'all',
              }}
              loading={
                <div className="flex items-center justify-center h-full w-full text-slate-500 font-mono text-sm">
                  Loading Live Workspace...
                </div>
              }
            />
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="w-full md:w-1/2 h-80 md:h-full bg-white border-t md:border-t-0 md:border-l border-[#252526] flex flex-col shrink-0 relative">
            <div className="h-9 bg-[#181818] border-b border-[#252526] flex items-center justify-between px-4 select-none text-[11px] font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-white uppercase tracking-wider">Live Preview</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer font-bold text-xs">
                ×
              </button>
            </div>
            <iframe 
              srcDoc={previewContent} 
              className="flex-1 w-full border-none bg-white"
              sandbox="allow-scripts"
            />
          </div>
        )}
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
