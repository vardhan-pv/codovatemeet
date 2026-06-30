'use client'

import React, { useEffect, useRef } from 'react'
import type { Terminal as XTerm } from 'xterm'
import type { FitAddon as FitAddonType } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalProps {
  onTerminalReady: (term: XTerm | null) => void
}

export function Terminal({ onTerminalReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddonType | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    let isMounted = true
    let termInstance: XTerm | null = null
    let observerInstance: ResizeObserver | null = null

    const handleResize = () => {
      try {
        if (fitAddonRef.current) fitAddonRef.current.fit()
      } catch (e) {}
    }

    const initTerminal = async () => {
      const { Terminal: XTermClass } = await import('xterm')
      const { FitAddon } = await import('xterm-addon-fit')
      
      if (!isMounted) return

      const term = new XTermClass({
        theme: {
          background: '#050816', // Rich Navy
          foreground: '#e2e8f0',
          cursor: '#6366f1',
          selectionBackground: 'rgba(99, 102, 241, 0.3)',
        },
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 13,
        cursorBlink: true,
        convertEol: true,
        disableStdin: false
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      let isRendered = false

      observerInstance = new ResizeObserver((entries) => {
        if (!terminalRef.current) return
        
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) {
          if (!isRendered) {
            term.open(terminalRef.current)
            onTerminalReady(term)
            isRendered = true
          }
          
          try {
            fitAddon.fit()
          } catch (e) {
            // ignore fit errors during rapid resizing
          }
        }
      })

      observerInstance.observe(terminalRef.current)

      xtermRef.current = term
      fitAddonRef.current = fitAddon
      termInstance = term

      window.addEventListener('resize', handleResize)
    }

    initTerminal()

    return () => {
      isMounted = false
      window.removeEventListener('resize', handleResize)
      if (observerInstance) observerInstance.disconnect()
      if (termInstance) termInstance.dispose()
      if (xtermRef.current) xtermRef.current = null
      onTerminalReady(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full h-full bg-[#050816] p-2 relative">
      <div className="absolute top-0 left-0 w-full h-full p-2" ref={terminalRef} />
    </div>
  )
}
