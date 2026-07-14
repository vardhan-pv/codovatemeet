'use client'

import React, { useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { ActivityBar } from './editor/ActivityBar'
import { SidebarPane } from './editor/SidebarPane'
import { TabBar } from './editor/TabBar'
import { PreviewPanel } from './editor/PreviewPanel'
import { TerminalPanel } from './editor/TerminalPanel'
import type { Terminal as XTerm } from 'xterm'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, AlertCircle, Copy, Check, Users, Play, TerminalSquare, RefreshCw } from 'lucide-react'

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

  // Toggle Live Preview and Terminal to FALSE by default (VS Code clean mode)
  const [showExplorer, setShowExplorer] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'search' | 'comments'>('explorer')
  const [showPreview, setShowPreview] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [rootFolderName, setRootFolderName] = useState('WORKSPACE')
  
  // Custom Modals
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  
  // Dropdown Menu Active States (Image 3)
  const [activeDropdown, setActiveDropdown] = useState<'file' | 'edit' | 'selection' | 'view' | 'go' | 'run' | 'terminal' | 'help' | null>(null)

  // GitHub Integration Modal states
  const [showGitHubModal, setShowGitHubModal] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [githubBranch, setGithubBranch] = useState('main')
  const [githubCommitMsg, setGithubCommitMsg] = useState('Sync from Codovate Meet collaborative workspace')
  const [githubPushingStatus, setGithubPushingStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle')
  const [githubErrorText, setGithubErrorText] = useState('')
  const [githubSuccessUrl, setGithubSuccessUrl] = useState('')
  const [pushProgress, setPushProgress] = useState('')

  const [comments, setComments] = useState<{ id: string; filename: string; line: number; text: string; author: string; time: string }[]>([])
  const [peerCursors, setPeerCursors] = useState<{ [senderSid: string]: { filename: string; lineNumber: number; column: number; username: string } }>({})
  const [decorations, setDecorations] = useState<string[]>([])
  
  const editorRef = useRef<any>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Retrieve saved github credentials on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('codovate_github_token')
      const savedRepo = localStorage.getItem('codovate_github_repo')
      if (savedToken) setGithubToken(savedToken)
      if (savedRepo) setGithubRepo(savedRepo)
    }
  }, [])

  // Close active dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Auto-generate preview content
  useEffect(() => {
    const htmlFile = files['index.html'] || Object.values(files).find(f => f.language === 'html')
    if (!htmlFile) {
      setPreviewContent(`
        <div style="background: #09090b; color: #71717a; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
          <div>
            <h3 style="color: #fff; margin-bottom: 8px;">No HTML File Found</h3>
            <p style="font-size: 12px; max-width: 250px; margin: 0 auto; line-height: 1.5;">Create or import an <strong>index.html</strong> file in the sidebar to enable Live Preview.</p>
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

  // Sync local files when code prop changes (used for Read-Only Presentation Mode)
  useEffect(() => {
    if (readOnly && code) {
      try {
        const parsed = JSON.parse(code)
        if (JSON.stringify(parsed) !== JSON.stringify(files)) {
          setActiveFile(Object.keys(parsed)[0] || 'index.html')
        }
      } catch (e) {}
    }
  }, [code, readOnly])

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

  // File management
  const handleCreateFile = (defaultPath?: string) => {
    const filename = prompt("Enter new filename (e.g. index.py, style.css, app.ts):", defaultPath || '')
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
    else if (ext === 'cpp' || ext === 'cc' || ext === 'h') fileLang = 'cpp'
    else if (ext === 'java') fileLang = 'java'
    else if (ext === 'go') fileLang = 'go'
    else if (ext === 'rs') fileLang = 'rust'
    
    const newFileCode = fileLang === 'html' 
      ? `<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`
      : fileLang === 'python'
        ? `print("Hello from python file ${filename}!")`
        : fileLang === 'cpp'
          ? `#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++ file ${filename}!" << std::endl;\n    return 0;\n}`
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

  // Folder Upload
  const handleFolderUploadClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files
    if (!filesList || filesList.length === 0) return

    const newFiles: { [filename: string]: { code: string; language: string } } = {}

    // Extract root folder name (Image 1)
    const rootName = filesList[0].webkitRelativePath.split('/')[0] || 'WORKSPACE'
    setRootFolderName(rootName)

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i]
      if (file.size > 500 * 1024) continue // Skip files > 500KB

      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const langMap: { [key: string]: string } = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        cpp: 'cpp',
        cc: 'cpp',
        h: 'cpp',
        java: 'java',
        go: 'go',
        rs: 'rust',
        rb: 'ruby',
        php: 'php',
        sql: 'sql',
        sh: 'shell',
        txt: 'plaintext'
      }

      const fileLang = langMap[ext]
      if (!fileLang) continue // Skip unsupported extensions

      try {
        const text = await file.text()
        const key = file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') || file.name : file.name
        newFiles[key] = { code: text, language: fileLang }
      } catch (err) {
        // ignore read errors
      }
    }

    if (Object.keys(newFiles).length === 0) {
      alert("No compatible text/code files found in the folder!")
      return
    }

    // COMPLETE OVERWRITE: Clean out existing duplicates or placeholders on new folder upload
    const firstUploaded = Object.keys(newFiles)[0]
    setActiveFile(firstUploaded)
    onCodeChange(JSON.stringify(newFiles))
    if (sendData) {
      sendData('CODE_EDIT', { code: JSON.stringify(newFiles) })
    }
  }

  // GitHub Push
  const handleGitHubPush = async () => {
    if (!githubToken.trim() || !githubRepo.trim() || !githubBranch.trim()) {
      setGithubErrorText('All fields except commit message are required.')
      setGithubPushingStatus('error')
      return
    }

    localStorage.setItem('codovate_github_token', githubToken)
    localStorage.setItem('codovate_github_repo', githubRepo)

    setGithubPushingStatus('pushing')
    setGithubErrorText('')
    setGithubSuccessUrl('')

    const fileKeysToPush = Object.keys(files)
    const headers: HeadersInit = {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }

    try {
      for (let i = 0; i < fileKeysToPush.length; i++) {
        const fname = fileKeysToPush[i]
        const fileContent = files[fname].code
        const base64Content = btoa(unescape(encodeURIComponent(fileContent)))

        setPushProgress(`Staging file: ${fname} (${i + 1}/${fileKeysToPush.length})...`)

        let sha: string | undefined = undefined
        try {
          const res = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${fname}?ref=${githubBranch}`, { headers })
          if (res.status === 200) {
            const data = await res.json()
            sha = data.sha
          }
        } catch (e) {
          // ignore
        }

        const putRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${fname}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: githubCommitMsg,
            content: base64Content,
            branch: githubBranch,
            sha: sha
          })
        })

        if (!putRes.ok) {
          const errData = await putRes.json()
          throw new Error(errData.message || `Failed to push ${fname}`)
        }
      }

      setGithubPushingStatus('success')
      setGithubSuccessUrl(`https://github.com/${githubRepo}/tree/${githubBranch}`)
    } catch (err: any) {
      setGithubErrorText(err.message || 'Push failed. Check repo owner/name structure and PAT scope.')
      setGithubPushingStatus('error')
    }
  }

  // Copy workspace invitation details
  const copyMeetingLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Comments & Search triggers
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

  const handleTerminalReady = (term: XTerm | null) => {
    xtermRef.current = term
    if (term) {
      term.clear()
      term.writeln('\x1b[1;36m⚡ Codovate Live Sandbox Output Terminal\x1b[0m')
      term.writeln('\x1b[38;5;244mPress "Run Code" inside the Run menu to execute your code inside the secure container.\x1b[0m')
      term.writeln('')
    }
  }

  const searchResults = getSearchResults()

  return (
    <div className={`flex flex-col h-full bg-[#0d0d12] rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${
      isFullScreen ? 'fixed inset-0 w-screen h-screen z-50 rounded-none' : 'relative'
    }`}>
      
      {/* Invisible HTML5 Directory Upload Input */}
      <input 
        type="file" 
        ref={folderInputRef}
        onChange={handleFolderUpload}
        style={{ display: 'none' }}
        {...{ webkitdirectory: '', directory: '', multiple: true }} 
      />

      {/* ── VS Code Style Header Menu Bar (Image 1 & 3) ── */}
      <div className="h-9 bg-[#1c1c1e] border-b border-white/5 flex items-center justify-between px-3 shrink-0 shadow-md select-none text-[11px] font-sans">
        <div className="flex items-center gap-1">
          {/* Logo icon */}
          <div className="w-4 h-4 rounded-sm bg-primary/20 flex items-center justify-center mr-2 text-[9px] font-bold text-primary">A</div>
          
          {/* Interactive Dropdowns */}
          <div className="flex items-center gap-1 text-slate-300">
            {/* File Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'file' ? null : 'file') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'file' ? 'bg-white/5 text-white' : ''}`}
              >
                File
              </button>
              {activeDropdown === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => { handleCreateFile('') }} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>New File...</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+N</span>
                  </button>
                  <button onClick={handleFolderUploadClick} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Open Folder...</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+K O</span>
                  </button>
                  <button onClick={() => { setAutoSaveStatus('saved') }} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between border-b border-white/5">
                    <span>Save</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+S</span>
                  </button>
                  <button onClick={() => { setShowGitHubModal(true) }} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Push to GitHub...</span>
                  </button>
                  <button onClick={() => { setShowShareModal(true) }} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Share...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'edit' ? null : 'edit') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'edit' ? 'bg-white/5 text-white' : ''}`}
              >
                Edit
              </button>
              {activeDropdown === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => setSidebarTab('search')} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Find & Replace</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+F</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selection Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'selection' ? null : 'selection') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'selection' ? 'bg-white/5 text-white' : ''}`}
              >
                Selection
              </button>
              {activeDropdown === 'selection' && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => { if (editorRef.current) editorRef.current.focus() }} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Select All</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+A</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'view' ? null : 'view') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'view' ? 'bg-white/5 text-white' : ''}`}
              >
                View
              </button>
              {activeDropdown === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => setShowExplorer(!showExplorer)} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Toggle Explorer</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+B</span>
                  </button>
                  <button onClick={() => setIsFullScreen(!isFullScreen)} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Toggle Full Screen</span>
                    <span className="text-[9px] text-slate-500 font-mono">F11</span>
                  </button>
                  <button onClick={() => setShowPreview(!showPreview)} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between border-t border-white/5">
                    <span>Live Preview</span>
                  </button>
                </div>
              )}
            </div>

            {/* Go Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'go' ? null : 'go') }}
                className="px-2 py-1 rounded transition hover:bg-white/5 hover:text-white"
              >
                Go
              </button>
            </div>

            {/* Run Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'run' ? null : 'run') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'run' ? 'bg-white/5 text-white' : ''}`}
              >
                Run
              </button>
              {activeDropdown === 'run' && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={runCode} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Run Without Debugging</span>
                    <span className="text-[9px] text-slate-500 font-mono">F5</span>
                  </button>
                </div>
              )}
            </div>

            {/* Terminal Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'terminal' ? null : 'terminal') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'terminal' ? 'bg-white/5 text-white' : ''}`}
              >
                Terminal
              </button>
              {activeDropdown === 'terminal' && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => setShowTerminal(!showTerminal)} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left flex justify-between">
                    <span>Toggle Terminal</span>
                    <span className="text-[9px] text-slate-500 font-mono">Ctrl+\`</span>
                  </button>
                </div>
              )}
            </div>

            {/* Help Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'help' ? null : 'help') }}
                className={`px-2 py-1 rounded transition hover:bg-white/5 hover:text-white ${activeDropdown === 'help' ? 'bg-white/5 text-white' : ''}`}
              >
                Help
              </button>
              {activeDropdown === 'help' && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e1e24] border border-white/10 rounded shadow-2xl z-50 flex flex-col py-1 text-slate-350 select-none animate-in fade-in duration-100">
                  <button onClick={() => alert("Antigravity IDE v1.0.0 — Collaborative Code Workspace")} className="px-3 py-1.5 hover:bg-primary/20 hover:text-white text-left">
                    <span>About</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Display name of active workspace project center */}
        <div className="text-slate-450 text-[10px] hidden md:block max-w-sm truncate">
          {currentFile} — {rootFolderName} — Antigravity IDE
        </div>

        {/* Sync indicators on the right */}
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono select-none">Language:</span>
            <select 
              className="bg-slate-900 border border-white/10 rounded-md px-1.5 py-0.5 text-[10px] text-slate-300 font-mono focus:ring-0 cursor-pointer outline-none transition-all hover:bg-slate-800"
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
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold select-none cursor-default" title="Auto Save Status">
            <span className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span className="hidden lg:inline">{autoSaveStatus === 'saved' ? 'Synced & Saved' : 'Saving...'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row min-h-0 relative">
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
              onFolderUploadClick={handleFolderUploadClick}
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
              rootFolderName={rootFolderName}
            />
          </div>
        )}

        {/* ── Monaco Editor Workspace ── */}
        <div className="flex-grow flex flex-col min-w-0 h-full relative">
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

          <div className="flex-grow relative w-full min-h-0 bg-[#0d0d12]">
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

      {/* ── VS Code Style Bottom Panel (Image 2) ── */}
      {showTerminal && (
        <TerminalPanel 
          onTerminalReady={handleTerminalReady}
          onClose={() => setShowTerminal(false)}
        />
      )}

      {/* ── GitHub Modal Overlay ── */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col font-sans select-none text-slate-200">
            <button 
              onClick={() => {
                setShowGitHubModal(false)
                setGithubPushingStatus('idle')
              }} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Push Workspace to GitHub</h3>
            <p className="text-xs text-slate-450 mb-5 leading-relaxed">Save your workspace code directly to a GitHub repository.</p>

            {githubPushingStatus === 'pushing' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-xs text-slate-350 font-medium">{pushProgress}</p>
              </div>
            ) : githubPushingStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in-95 duration-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Push Completed Successfully!</h4>
                <p className="text-xs text-slate-450 mb-4">All workspace files have been pushed to your branch.</p>
                <a 
                  href={githubSuccessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary-hover text-white text-xs px-4 py-2 rounded-lg font-bold transition-all"
                >
                  View Files on GitHub
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450">GitHub Personal Access Token (PAT)</label>
                  <input 
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-xs transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450">Repository Path</label>
                  <input 
                    type="text"
                    placeholder="username/repository-name"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-xs transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-450">Branch</label>
                    <input 
                      type="text"
                      placeholder="main"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-xs transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-450">Version Control</label>
                    <div className="p-2.5 bg-slate-950/65 border border-white/5 text-slate-500 rounded-lg text-xs cursor-not-allowed select-none">
                      Active Workspace
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450">Commit Message</label>
                  <textarea 
                    rows={2}
                    value={githubCommitMsg}
                    onChange={(e) => setGithubCommitMsg(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-xs transition-all"
                  />
                </div>

                {githubErrorText && (
                  <div className="flex items-start gap-2 text-rose-500 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{githubErrorText}</span>
                  </div>
                )}

                <Button 
                  onClick={handleGitHubPush}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-bold text-xs transition-all"
                >
                  Sync & Push Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Share Modal Overlay ── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl flex flex-col font-sans select-none text-slate-200">
            <button 
              onClick={() => setShowShareModal(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Share Workspace
            </h3>
            <p className="text-xs text-slate-450 mb-5 leading-relaxed">Collaborate in real-time with other developers in this meeting room.</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-450">Direct Join URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 p-2 bg-slate-950 border border-white/10 text-slate-400 rounded-lg text-xs outline-none focus:border-primary truncate select-all font-mono"
                  />
                  <Button 
                    size="sm"
                    onClick={copyMeetingLink}
                    className={`shrink-0 h-8 rounded-lg px-3 transition-all ${
                      copiedLink ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Sync Channels</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> WebRTC Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Auto-Save Status</span>
                  <span className="text-slate-500">Synced to cloud</span>
                </div>
              </div>

              <Button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('sync_terminal'))
                  alert("Terminal output sync broadcasted to all participants!")
                }}
                className="w-full border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white py-2 rounded-lg font-bold text-xs transition-all"
              >
                Broadcast Sandbox Output
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
