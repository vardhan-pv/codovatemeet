'use client'

import React, { useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { EditorHeader } from './editor/EditorHeader'
import { ActivityBar } from './editor/ActivityBar'
import { SidebarPane } from './editor/SidebarPane'
import { TabBar } from './editor/TabBar'
import { PreviewPanel } from './editor/PreviewPanel'
import { TerminalPanel } from './editor/TerminalPanel'
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
  // Parse serialized files JSON or fallback to default structure
  let files: { [filename: string]: { code: string; language: string } } = {
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
  const [isExecuting, setIsExecuting] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  
  const [comments, setComments] = useState<{ id: string; filename: string; line: number; text: string; author: string; time: string }[]>([])
  const [peerCursors, setPeerCursors] = useState<{ [senderSid: string]: { filename: string; lineNumber: number; column: number; username: string } }>({})
  const [decorations, setDecorations] = useState<string[]>([])
  
  const editorRef = useRef<any>(null)
  const xtermRef = useRef<XTerm | null>(null)

  // Collapse sidebars on smaller viewports initially
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowExplorer(false)
      setShowPreview(false)
      setShowTerminal(false)
    }
  }, [])

  // Auto-generate preview content
  useEffect(() => {
    const htmlFile = files['index.html'] || Object.values(files).find(f => f.language === 'html')
    if (!htmlFile) {
      setPreviewContent(`
        <div style="background: #09090b; color: #71717a; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
          <div>
            <h3 style="color: #fff; margin-bottom: 8px;">No HTML File Found</h3>
            <p style="font-size: 12px; max-width: 250px; margin: 0 auto; line-height: 1.5;">Create an <strong>index.html</strong> file in the file explorer to enable real-time Live Preview.</p>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerCursors, currentFile])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Set a custom VS Code dark theme
    monaco.editor.defineTheme('vscode-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '0d0d12' },
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
        'editor.background': '#0d0d12',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#181824',
        'editorLineNumber.foreground': '#5c5c64',
        'editorLineNumber.activeForeground': '#a5a5b2',
        'editorIndentGuide.background': '#252535',
        'editorIndentGuide.activeBackground': '#404050',
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
  }, [room, onCodeChange])

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
    term.clear()
    term.writeln(`\x1b[1;34m$ codovate run ${currentFile}\x1b[0m`)
    term.writeln('\x1b[38;5;244mCompiling and starting secure sandbox...\x1b[0m')
    
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
      term.writeln(`\n\x1b[38;5;244m[Process exited with code ${data.error ? '1' : '0'}]\x1b[0m\n`)
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
    const results: { filename: string; line: number; text: string }[] = []
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

  const handleNavigateToComment = (filename: string, line: number) => {
    setActiveFile(filename)
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column: 1 })
      editorRef.current.focus()
    }
  }

  const handleGitHubSync = () => {
    const repo = prompt("Enter GitHub repository (e.g. facebook/react):")
    if (repo) {
      onCodeChange(`// Pulled from ${repo}\n// This is a mock response. In a future phase, we will use the GitHub API.\n\nexport function App() {\n  return <div>Hello GitHub!</div>\n}\n`)
    }
  }

  const handleTerminalReady = (term: XTerm | null) => {
    xtermRef.current = term
    if (term) {
      term.clear()
      term.writeln('\x1b[1;36m⚡ Codovate Live Sandbox Output Terminal\x1b[0m')
      term.writeln('\x1b[38;5;244mPress "Run Code" above to execute your code inside the secure container.\x1b[0m')
      term.writeln('')
    }
  }

  const searchResults = getSearchResults()

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* ── Editor Header ── */}
      <EditorHeader 
        showExplorer={showExplorer}
        setShowExplorer={setShowExplorer}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        showTerminal={showTerminal}
        setShowTerminal={setShowTerminal}
        activeLanguage={activeFileInfo.language}
        onLanguageChange={(lang) => {
          const updatedFiles = {
            ...files,
            [currentFile]: {
              ...files[currentFile],
              language: lang
            }
          }
          onCodeChange(JSON.stringify(updatedFiles))
          if (sendData) {
            sendData('CODE_EDIT', { code: JSON.stringify(updatedFiles) })
          }
        }}
        autoSaveStatus={autoSaveStatus}
        isExecuting={isExecuting}
        onRunCode={runCode}
        onGitHubSync={handleGitHubSync}
      />
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Activity Bar & Sidebar pane Wrapper */}
        {showExplorer && (
          <div className="flex h-full shrink-0 border-r border-white/5">
            <ActivityBar 
              sidebarTab={sidebarTab}
              setSidebarTab={setSidebarTab}
              onToggleAiSidebar={() => window.dispatchEvent(new CustomEvent('toggle_ai_sidebar'))}
            />
            <SidebarPane 
              sidebarTab={sidebarTab}
              fileKeys={fileKeys}
              files={files}
              currentFile={currentFile}
              onSelectFile={(fname) => {
                setActiveFile(fname)
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setShowExplorer(false)
                }
              }}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              replaceQuery={replaceQuery}
              setReplaceQuery={setReplaceQuery}
              onReplaceAll={handleReplaceAll}
              searchResults={searchResults}
              comments={comments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onNavigateToComment={handleNavigateToComment}
            />
          </div>
        )}

        {/* ── Monaco Editor Workspace ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <TabBar 
            fileKeys={fileKeys}
            files={files}
            currentFile={currentFile}
            onSelectFile={(fname) => {
              setActiveFile(fname)
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setShowExplorer(false)
              }
            }}
            onDeleteFile={handleDeleteFile}
            onCreateFile={handleCreateFile}
          />

          <div className="flex-1 relative w-full min-h-0 bg-[#0d0d12]">
            <Editor
              height="100%"
              language={activeFileInfo.language}
              value={activeFileInfo.code}
              theme="vs-dark"
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
                <div className="flex items-center justify-center h-full w-full text-slate-500 font-mono text-xs">
                  Loading Live Workspace...
                </div>
              }
            />
          </div>
        </div>

        {/* ── Live Preview Panel ── */}
        {showPreview && (
          <PreviewPanel 
            previewContent={previewContent}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>

      {/* ── Terminal Panel ── */}
      {showTerminal && (
        <TerminalPanel 
          onTerminalReady={handleTerminalReady}
          onClose={() => setShowTerminal(false)}
        />
      )}
    </div>
  )
}
