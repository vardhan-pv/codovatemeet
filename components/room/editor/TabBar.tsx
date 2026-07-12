import React from 'react'
import { Plus } from 'lucide-react'

interface TabBarProps {
  fileKeys: string[]
  files: { [filename: string]: { code: string; language: string } }
  currentFile: string
  onSelectFile: (fname: string) => void
  onDeleteFile: (fname: string) => void
  onCreateFile: () => void
}

export function TabBar({
  fileKeys,
  files,
  currentFile,
  onSelectFile,
  onDeleteFile,
  onCreateFile
}: TabBarProps) {
  return (
    <div className="h-9 bg-slate-950 flex items-center select-none text-[10px] font-mono text-[#858585] border-b border-white/10 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {fileKeys.map(fname => {
        const fileInfo = files[fname] || { language: 'javascript' }
        const fileLang = fileInfo.language
        const isSelected = fname === currentFile
        return (
          <div
            key={fname}
            onClick={() => onSelectFile(fname)}
            className={`flex items-center px-4 h-full border-r border-white/5 text-[#c5c5c5] gap-2 cursor-pointer transition-all shrink-0 ${
              isSelected 
                ? 'bg-[#18181b] border-t-2 border-t-primary text-white font-extrabold shadow-inner' 
                : 'bg-slate-950 hover:bg-white/5 text-slate-500'
            }`}
          >
            <span className={`text-[8px] font-extrabold uppercase px-1 rounded leading-none ${
              fileLang === 'javascript' ? 'text-yellow-500 bg-yellow-500/10' :
              fileLang === 'typescript' ? 'text-blue-400 bg-blue-500/10' :
              fileLang === 'python' ? 'text-green-400 bg-green-500/10' :
              fileLang === 'html' ? 'text-orange-500 bg-orange-500/10' : 'text-teal-400 bg-teal-500/10'
            }`}>
              {fileLang === 'javascript' ? 'JS' :
               fileLang === 'typescript' ? 'TS' :
               fileLang === 'python' ? 'PY' :
               fileLang === 'html' ? 'HTML' : 'CSS'}
            </span>
            <span className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>{fname}</span>
            {fileKeys.length > 1 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFile(fname)
                }}
                className="ml-2 hover:bg-white/10 rounded px-1 py-0.5 text-[10px] text-slate-500 hover:text-rose-400 flex items-center justify-center transition"
                title="Delete File"
              >
                ×
              </span>
            )}
          </div>
        )
      })}

      <button
        onClick={onCreateFile}
        className="px-3.5 h-full hover:bg-white/5 text-slate-500 hover:text-white flex items-center border-r border-white/5 transition font-bold text-sm shrink-0 bg-transparent border-y-none outline-none cursor-pointer"
        title="Create New File"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div className="flex-grow bg-slate-950 h-full" />
    </div>
  )
}
