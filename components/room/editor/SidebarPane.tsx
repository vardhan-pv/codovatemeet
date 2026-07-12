import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, MessageSquare, CornerDownRight, Plus } from 'lucide-react'

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
  onCreateFile: () => void
  onDeleteFile: (fname: string) => void
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
}

export function SidebarPane({
  sidebarTab,
  fileKeys,
  files,
  currentFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  searchQuery,
  setSearchQuery,
  replaceQuery,
  setReplaceQuery,
  onReplaceAll,
  searchResults,
  comments,
  onAddComment,
  onDeleteComment,
  onNavigateToComment
}: SidebarPaneProps) {
  return (
    <aside className="w-56 bg-[#18181b] flex flex-col select-none shrink-0 font-mono text-[11px] text-[#c5c5c5] border-r border-white/5 h-full">
      {sidebarTab === 'explorer' ? (
        <>
          <div className="p-3 border-b border-white/5 flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider">
            <span>Explorer</span>
            <button 
              onClick={onCreateFile} 
              className="hover:text-white hover:bg-white/5 p-1 rounded font-bold text-slate-400 bg-transparent border-none outline-none cursor-pointer transition flex items-center justify-center"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
            {fileKeys.map(fname => {
              const fileInfo = files[fname] || { language: 'javascript' }
              const fileLang = fileInfo.language
              const isSelected = fname === currentFile
              return (
                <div
                  key={fname}
                  onClick={() => onSelectFile(fname)}
                  className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-all border-l-2 ${
                    isSelected 
                      ? 'bg-primary/10 text-white font-semibold border-l-primary' 
                      : 'hover:bg-white/5 text-slate-400 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                      fileLang === 'javascript' ? 'bg-yellow-500/10 text-yellow-500' :
                      fileLang === 'typescript' ? 'bg-blue-500/10 text-blue-400' :
                      fileLang === 'python' ? 'bg-green-500/10 text-green-400' :
                      fileLang === 'html' ? 'bg-orange-500/10 text-orange-500' : 'bg-teal-500/10 text-teal-400'
                    }`}>
                      {fileLang === 'javascript' ? 'JS' :
                       fileLang === 'typescript' ? 'TS' :
                       fileLang === 'python' ? 'PY' :
                       fileLang === 'html' ? 'HTML' : 'CSS'}
                    </span>
                    <span className="truncate">{fname}</span>
                  </div>
                  {fileKeys.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteFile(fname)
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 text-xs ml-1 bg-transparent border-none cursor-pointer p-0.5 rounded transition-all"
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
                    <span className="truncate flex items-center gap-1 text-primary"><ChevronRight className="w-3 h-3 shrink-0" /> {res.filename}</span>
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
                    <span className="truncate flex items-center gap-1 text-emerald-400"><MessageSquare className="w-3 h-3 shrink-0" /> {c.author}</span>
                    <span className="text-slate-500 font-normal text-[8px]">{c.time}</span>
                  </div>
                  <div className="text-slate-500 text-[8px] flex items-center gap-1.5 font-bold">
                    <CornerDownRight className="w-2.5 h-2.5 text-slate-600 shrink-0" /> {c.filename} : Line {c.line}
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
