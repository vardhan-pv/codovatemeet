'use client'

import React, { useState, useEffect } from 'react'
import { Room } from 'livekit-client'
import { Send, User, MessageSquare, ShieldAlert, Lock, ArrowLeft, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface DirectMessage {
  id: string
  senderIdentity: string
  senderName: string
  recipientIdentity: string
  recipientName: string
  text: string
  timestamp: number
  isMe: boolean
}

interface DirectMessageDrawerProps {
  room: Room | null
  participants: any[]
  currentIdentity: string
  currentName: string
  isDirectMessagingDisabled?: boolean
  isHost?: boolean
}

export function DirectMessageDrawer({
  room,
  participants,
  currentIdentity,
  currentName,
  isDirectMessagingDisabled = false,
  isHost = false
}: DirectMessageDrawerProps) {
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null)
  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>({})
  const [messageInput, setMessageInput] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Helper to extract display name
  const getDisplayName = (identity: string) => {
    if (!identity) return 'Unknown'
    const index = identity.lastIndexOf('_')
    return index !== -1 ? identity.substring(0, index) : identity
  }

  // Listen for targeted LiveKit data messages for DMs
  useEffect(() => {
    if (!room) return

    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(payload))
        if (decoded.type === 'DIRECT_MESSAGE') {
          const senderId = decoded.senderIdentity || participant?.identity
          const senderName = decoded.senderName || getDisplayName(senderId)

          const dm: DirectMessage = {
            id: Math.random().toString(),
            senderIdentity: senderId,
            senderName,
            recipientIdentity: currentIdentity,
            recipientName: currentName,
            text: decoded.text,
            timestamp: Date.now(),
            isMe: false
          }

          setMessages((prev) => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), dm]
          }))

          if (selectedPeer?.identity !== senderId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }))
          }
        }
      } catch (e) {}
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room, currentIdentity, currentName, selectedPeer])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedPeer || !room) return

    const text = messageInput.trim()
    const recipientId = selectedPeer.identity

    const dm: DirectMessage = {
      id: Math.random().toString(),
      senderIdentity: currentIdentity,
      senderName: currentName,
      recipientIdentity: recipientId,
      recipientName: getDisplayName(recipientId),
      text,
      timestamp: Date.now(),
      isMe: true
    }

    setMessages((prev) => ({
      ...prev,
      [recipientId]: [...(prev[recipientId] || []), dm]
    }))

    // Send over LiveKit targeted data channel
    try {
      const payload = JSON.stringify({
        type: 'DIRECT_MESSAGE',
        senderIdentity: currentIdentity,
        senderName: currentName,
        text
      })
      const bytes = new TextEncoder().encode(payload)
      room.localParticipant.publishData(bytes, {
        reliable: true,
        destinationIdentities: [recipientId]
      })
    } catch (err) {
      console.error('Failed to send direct message:', err)
    }

    setMessageInput('')
  }

  const handleSelectPeer = (peer: any) => {
    setSelectedPeer(peer)
    setUnreadCounts((prev) => ({
      ...prev,
      [peer.identity]: 0
    }))
  }

  if (isDirectMessagingDisabled && !isHost) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 select-none">
        <Lock className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
        <h4 className="text-sm font-bold text-slate-200">Direct Messaging Locked</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          The meeting host has disabled direct 1-on-1 messaging for participants.
        </p>
      </div>
    )
  }

  // Active Peer Chat View
  if (selectedPeer) {
    const peerId = selectedPeer.identity
    const conversation = messages[peerId] || []

    return (
      <div className="flex flex-col h-full bg-slate-950/60 border-l border-white/10">
        {/* DM Conversation Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedPeer(null)}
              className="h-7 w-7 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 uppercase">
              {getDisplayName(peerId).slice(0, 2)}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {getDisplayName(peerId)}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Private DM Channel</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {conversation.length === 0 && (
              <p className="text-center text-xs text-slate-500 my-8">
                This is the start of your private conversation with {getDisplayName(peerId)}.
              </p>
            )}

            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] break-words shadow-sm ${
                    msg.isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-900/60 flex gap-2">
          <Input
            placeholder={`Message ${getDisplayName(peerId)}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="bg-slate-900 border-white/10 text-xs text-white"
          />
          <Button type="submit" disabled={!messageInput.trim()} className="bg-blue-600 hover:bg-blue-500">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    )
  }

  // Peer Select List
  const otherParticipants = participants.filter((p) => p.identity !== currentIdentity)

  const filteredPeers = otherParticipants.filter((p) =>
    getDisplayName(p.identity).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-slate-950/60">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Direct Messages ({otherParticipants.length})
        </h4>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 bg-slate-900 border-white/10 text-xs text-white"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5">
          {filteredPeers.length === 0 && (
            <p className="text-center text-xs text-slate-500 my-6">No other participants online.</p>
          )}

          {filteredPeers.map((p) => {
            const pid = p.identity
            const unread = unreadCounts[pid] || 0

            return (
              <button
                key={pid}
                onClick={() => handleSelectPeer(p)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-white/5 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                    {getDisplayName(pid).slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-36">
                      {getDisplayName(pid)}
                    </span>
                    <span className="text-[10px] text-slate-400">Click to start DM</span>
                  </div>
                </div>

                {unread > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    {unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
