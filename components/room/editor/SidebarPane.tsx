import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileJson, 
  Settings, GitBranch, Terminal, Code2, Palette, FileText, File, Package, Plus, FolderUp, MessageSquare, CornerDownRight, MoreHorizontal,
  X, Download, FolderPlus, FilePlus, Trash2
} from 'lucide-react'

interface Comment {
  id: string
  filename: string
  line: number
  text: string
  author: string
  time: string
}

interface SidebarPaneProps {
  sidebarTab: 'explorer' | 'search' | 'comments'
  fileKeys: string[]
  files: { [filename: string]: { code: string; language: string } }
  currentFile: string
  onSelectFile: (fname: string) => void
  onCreateFile: (defaultPath?: string) => void
  onCreateFolder?: (defaultPath?: string) => void
  onDeleteFile: (fname: string) => void
  onFolderUploadClick: () => void
  onCloseExplorer?: () => void
  onDownloadFile?: (fname: string) => void
  onDownloadWorkspaceZip?: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  replaceQuery: string
  setReplaceQuery: (query: string) => void
  onReplaceAll: () => void
  searchResults: { filename: string; line: number; text: string }[]
  comments: Comment[]
  onAddComment: () => void
  onDeleteComment: (cid: string) => void
  onNavigateToComment: (filename: string, line: number) => void
  rootFolderName?: string
}

// Tree Node Structure
interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  children: TreeNode[]
}

// Helper to build tree from flat list of paths
function buildTree(fileKeys: string[]): TreeNode {
  const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] }

  fileKeys.forEach(filePath => {
    // Standardize path delimiters
    const normalizedPath = filePath.replace(/\\/g, '/')
    const parts = normalizedPath.split('/')
    let current = root

    parts.forEach((part, index) => {
      const isFolder = index < parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')

      let existingNode = current.children.find(child => child.name === part && child.isFolder === isFolder)

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          isFolder,
          children: []
        }
        current.children.push(existingNode)
      }
      current = existingNode
    })
  })

  // Sort folder children: directories first, then files alphabetically
  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sortTree)
  }

  sortTree(root)
  return root
}

export function SidebarPane({
  sidebarTab,
  fileKeys,
  files,
  currentFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onFolderUploadClick,
  onCloseExplorer,
  onDownloadFile,
  onDownloadWorkspaceZip,
  searchQuery,
  setSearchQuery,
  replaceQuery,
  setReplaceQuery,
  onReplaceAll,
  searchResults,
  comments,
  onAddComment,
  onDeleteComment,
  onNavigateToComment,
  rootFolderName = 'WORKSPACE'
}: SidebarPaneProps) {
  
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['components', 'app', 'backend']))
  const [isRootExpanded, setIsRootExpanded] = useState(true)

  // Automatically expand parent directories of active file
  useEffect(() => {
    if (currentFile) {
      const parts = currentFile.replace(/\\/g, '/').split('/')
      if (parts.length > 1) {
        setExpandedDirs(prev => {
          const next = new Set(prev)
          let currentPath = ''
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
            next.add(currentPath)
          }
          return next
        })
      }
    }
  }, [currentFile])

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  // Get custom colored folder icons
  const getFolderIcon = (name: string, isOpen: boolean) => {
    const colorMap: { [key: string]: string } = {
      app: 'text-rose-450',
      components: 'text-emerald-500',
      backend: 'text-violet-500',
      hooks: 'text-purple-400',
      lib: 'text-amber-500',
      public: 'text-sky-400',
      services: 'text-cyan-400',
      out: 'text-indigo-400',
      '.next': 'text-slate-400',
      node_modules: 'text-slate-500'
    }
    const colorClass = colorMap[name.toLowerCase()] || 'text-amber-400/90'
    return isOpen 
      ? <FolderOpen className={`w-4 h-4 shrink-0 ${colorClass}`} /> 
      : <Folder className={`w-4 h-4 shrink-0 ${colorClass}`} />
  }

  // Get VS Code themed file icons matching the second image
  const getFileIcon = (name: string, language: string) => {
    const lowerName = name.toLowerCase()
    
    if (lowerName === 'package.json' || lowerName === 'package-lock.json') {
      return <Package className="w-4 h-4 text-emerald-500 shrink-0" />
    }
    if (lowerName === '.gitignore' || lowerName === '.gitattributes') {
      return <GitBranch className="w-4 h-4 text-rose-500 shrink-0" />
    }
    if (lowerName.startsWith('.env')) {
      return <Settings className="w-4 h-4 text-amber-500 shrink-0" />
    }
    if (lowerName.endsWith('config.js') || lowerName.endsWith('config.mjs') || lowerName.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-blue-400 shrink-0" />
    }

    // Language fallbacks
    switch (language.toLowerCase()) {
      case 'javascript':
        return <Terminal className="w-4 h-4 text-yellow-500 shrink-0" />
      case 'typescript':
        return <Terminal className="w-4 h-4 text-sky-450 shrink-0" />
      case 'python':
        return <Code2 className="w-4 h-4 text-green-500 shrink-0" />
      case 'html':
        return <Code2 className="w-4 h-4 text-orange-500 shrink-0" />
      case 'css':
        return <Palette className="w-4 h-4 text-teal-400 shrink-0" />
      case 'markdown':
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />
    }
  }

  // Recursive Tree Renderer
  const renderTreeNodes = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map(node => {
      const isSelected = node.path === currentFile
      const fileInfo = files[node.path] || { language: 'plaintext' }
      
      if (node.isFolder) {
        const isOpen = expandedDirs.has(node.path)
        return (
          <div key={node.path} className="flex flex-col">
            <div
              onClick={() => toggleDirectory(node.path)}
              className="group flex items-center justify-between px-3 py-1 hover:bg-white/5 cursor-pointer text-slate-400 select-none transition-all duration-150"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                {getFolderIcon(node.name, isOpen)}
                <span className="truncate text-slate-300 font-sans text-xs">{node.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateFile(node.path + '/')
                  }}
                  className="hover:text-white p-0.5 rounded text-slate-500 bg-transparent border-none cursor-pointer"
                  title={`New file in ${node.name}`}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateFolder?.(node.path + '/')
                  }}
                  className="hover:text-white p-0.5 rounded text-slate-500 bg-transparent border-none cursor-pointer"
                  title={`New folder in ${node.name}`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {isOpen && renderTreeNodes(node.children, depth + 1)}
          </div>
        )
      } else {
        return (
          <div
            key={node.path}
            onClick={() => onSelectFile(node.path)}
            className={`group flex items-center justify-between px-3 py-1 cursor-pointer transition-all border-l-2 ${
              isSelected 
                ? 'bg-[#2a2d2e] text-white font-semibold border-l-primary shadow-inner' 
                : 'hover:bg-white/5 text-slate-400 border-l-transparent'
            }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
          >
            <div className="flex items-center gap-2 truncate">
              {getFileIcon(node.name, fileInfo.language)}
              <span className="truncate text-xs font-sans select-none">{node.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onDownloadFile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownloadFile(node.path)
                  }}
                  className="hover:text-sky-400 text-slate-500 p-0.5 bg-transparent border-none cursor-pointer transition-all"
                  title={`Download ${node.name}`}
                >
                  <Download className="w-3 h-3" />
                </button>
              ) : null}
              {fileKeys.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFile(node.path)
                  }}
                  className="hover:text-rose-450 text-slate-500 text-xs bg-transparent border-none cursor-pointer transition-all"
                  title="Delete File"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )
      }
    })
  }

  const treeRoot = buildTree(fileKeys)

  return (
    <aside className="w-56 bg-[#18181b] flex flex-col select-none shrink-0 border-r border-white/5 h-full">
      {sidebarTab === 'explorer' ? (
        <>
          {/* Main Sidebar Header (Explorer & Close button) */}
          <div className="p-3 flex justify-between items-center text-slate-400 select-none border-b border-white/5">
            <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-slate-300">Explorer</span>
            <div className="flex items-center gap-1">
              {onCloseExplorer ? (
                <button 
                  onClick={onCloseExplorer} 
                  className="hover:text-white hover:bg-white/10 p-1 rounded transition text-slate-400 cursor-pointer"
                  title="Close Explorer (Ctrl+B)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Root directory collapsible folder header */}
          <div className="flex flex-col flex-grow overflow-y-auto">
            <div
              onClick={() => setIsRootExpanded(!isRootExpanded)}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-white/5 cursor-pointer text-slate-400 select-none transition-all duration-150 border-b border-white/5 bg-slate-950/30"
            >
              <div className="flex items-center gap-1.5 truncate">
                {isRootExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                <span className="truncate text-xs font-bold text-slate-200 uppercase font-sans tracking-wide">{rootFolderName}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* New File Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateFile('')
                  }} 
                  className="hover:text-white hover:bg-white/10 p-1 rounded text-slate-400 bg-transparent border-none cursor-pointer transition flex items-center justify-center"
                  title="New File"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                {/* New Folder Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onCreateFolder) onCreateFolder('')
                  }} 
                  className="hover:text-white hover:bg-white/10 p-1 rounded text-slate-400 bg-transparent border-none cursor-pointer transition flex items-center justify-center"
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                {/* Folder Import Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onFolderUploadClick()
                  }} 
                  className="hover:text-white hover:bg-white/10 p-1 rounded text-slate-400 bg-transparent border-none cursor-pointer transition flex items-center justify-center"
                  title="Import Folder"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                </button>
                {/* Download Workspace ZIP */}
                {onDownloadWorkspaceZip && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownloadWorkspaceZip()
                    }} 
                    className="hover:text-sky-400 hover:bg-white/10 p-1 rounded text-slate-400 bg-transparent border-none cursor-pointer transition flex items-center justify-center"
                    title="Download Workspace (ZIP)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tree nodes inside collapsible root workspace */}
            {isRootExpanded && (
              <div className="py-1 space-y-0.5 animate-in fade-in duration-250">
                {renderTreeNodes(treeRoot.children)}
              </div>
            )}
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
              className="w-full p-2 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-[10px] transition-all font-mono"
            />
          </div>
          
          <div className="space-y-1">
            <input 
              type="text" 
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-white/10 text-white rounded-lg outline-none focus:border-primary text-[10px] transition-all font-mono"
            />
          </div>

          {searchQuery.trim() && (
            <Button 
              onClick={onReplaceAll}
              size="sm"
              className="w-full bg-primary hover:bg-primary-hover text-white h-8 text-[10px] rounded-lg transition-all"
            >
              Replace All
            </Button>
          )}

          <div className="flex-1 min-h-0 flex flex-col pt-2.5 border-t border-white/5">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Results ({searchResults.length})</span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searchResults.map((res, index) => (
                <div 
                  key={index}
                  onClick={() => onSelectFile(res.filename)}
                  className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950 border border-white/5 hover:border-primary/20 cursor-pointer text-[10px] group transition"
                >
                  <div className="flex justify-between items-center text-slate-350 font-bold mb-1">
                    <span className="truncate flex items-center gap-1 text-primary"><ChevronRight className="w-3.5 h-3.5 shrink-0" /> {res.filename}</span>
                    <span className="text-slate-500 font-normal">L{res.line}</span>
                  </div>
                  <p className="text-slate-400 font-mono truncate leading-normal italic pl-4">{res.text}</p>
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
              onClick={onAddComment} 
              className="hover:text-white hover:bg-white/5 text-slate-400 font-bold text-xs bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 outline-none cursor-pointer transition"
              title="Add Comment at cursor"
            >
              + Add
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Code Reviews ({comments.length})</span>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {comments.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => onNavigateToComment(c.filename, c.line)}
                  className="p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-950 border border-white/5 hover:border-emerald-500/20 cursor-pointer text-[10px] group transition flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center text-slate-300 font-bold">
                    <span className="truncate flex items-center gap-1 text-emerald-400"><MessageSquare className="w-3.5 h-3.5 shrink-0" /> {c.author}</span>
                    <span className="text-slate-500 font-normal text-[8px]">{c.time}</span>
                  </div>
                  <div className="text-slate-550 text-[8px] flex items-center gap-1.5 font-bold">
                    <CornerDownRight className="w-2.5 h-2.5 text-slate-655 shrink-0" /> {c.filename} : Line {c.line}
                  </div>
                  <p className="text-slate-200 font-sans mt-0.5 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteComment(c.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 self-end text-rose-500 hover:text-rose-450 transition text-[9px] bg-transparent border-none cursor-pointer mt-1"
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
  )
}
