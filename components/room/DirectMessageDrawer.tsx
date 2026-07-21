'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Room } from 'livekit-client'
import {
  Send, User, MessageSquare, ShieldAlert, Lock, ArrowLeft, Check,
  CheckCheck, Search, Users, Plus, X, MoreHorizontal
} from 'lucide-react'
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
  delivered?: boolean
  read?: boolean
}

export interface GroupChat {
  id: string
  name: string
  members: string[] // identities
  messages: DirectMessage[]
  createdBy: string
}

interface DirectMessageDrawerProps {
  room: Room | null
  participants: any[]
  currentIdentity: string
  currentName: string
  isDirectMessagingDisabled?: boolean
  isHost?: boolean
  initialPeerIdentity?: string | null
  onIncomingDmNotify?: (dm: { senderIdentity: string, senderName: string, text: string }) => void
}

export function DirectMessageDrawer({
  room,
  participants,
  currentIdentity,
  currentName,
  isDirectMessagingDisabled = false,
  isHost = false,
  initialPeerIdentity,
  onIncomingDmNotify
}: DirectMessageDrawerProps) {
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null)
  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>({})
  const [groupChats, setGroupChats] = useState<GroupChat[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupNameInput, setGroupNameInput] = useState('')
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'list' | 'dm' | 'group'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Helper to extract display name
  const getDisplayName = (identity: string) => {
    if (!identity) return 'Unknown'
    const index = identity.lastIndexOf('_')
    return index !== -1 ? identity.substring(0, index) : identity
  }

  // Handle initial peer jumping
  useEffect(() => {
    if (initialPeerIdentity) {
      const match = participants.find(p => p.identity === initialPeerIdentity || p.name === initialPeerIdentity)
      if (match) {
        setSelectedPeer(match)
        setActiveView('dm')
      } else {
        setSelectedPeer({ identity: initialPeerIdentity, name: getDisplayName(initialPeerIdentity) })
        setActiveView('dm')
      }
    }
  }, [initialPeerIdentity, participants])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedPeer, selectedGroup])

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
            isMe: false,
            delivered: true,
            read: false
          }

          setMessages((prev) => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), dm]
          }))

          if (onIncomingDmNotify && senderId !== currentIdentity) {
            onIncomingDmNotify({
              senderIdentity: senderId,
              senderName,
              text: decoded.text
            })
          }

          if (selectedPeer?.identity !== senderId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }))
          } else {
            // Auto-send read receipt
            sendReadReceipt(senderId)
          }
        }

        if (decoded.type === 'GROUP_MESSAGE') {
          const groupId = decoded.groupId
          const dm: DirectMessage = {
            id: Math.random().toString(),
            senderIdentity: decoded.senderIdentity,
            senderName: decoded.senderName,
            recipientIdentity: groupId,
            recipientName: decoded.groupName || 'Group',
            text: decoded.text,
            timestamp: Date.now(),
            isMe: false,
            delivered: true,
            read: false
          }

          setGroupChats(prev => prev.map(g =>
            g.id === groupId ? { ...g, messages: [...g.messages, dm] } : g
          ))

          if (selectedGroup?.id !== groupId) {
            setUnreadCounts(prev => ({
              ...prev,
              [groupId]: (prev[groupId] || 0) + 1
            }))
          }
        }

        if (decoded.type === 'DM_TYPING') {
          const senderId = decoded.senderIdentity
          setTypingUsers(prev => ({ ...prev, [senderId]: true }))
          if (typingTimeoutRef.current[senderId]) {
            clearTimeout(typingTimeoutRef.current[senderId])
          }
          typingTimeoutRef.current[senderId] = setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [senderId]: false }))
          }, 3000)
        }

        if (decoded.type === 'DM_READ_RECEIPT') {
          const senderId = decoded.senderIdentity
          setMessages(prev => {
            const updated = { ...prev }
            if (updated[senderId]) {
              updated[senderId] = updated[senderId].map(m =>
                m.isMe ? { ...m, read: true } : m
              )
            }
            return updated
          })
        }

        if (decoded.type === 'GROUP_INVITE') {
          const newGroup: GroupChat = {
            id: decoded.groupId,
            name: decoded.groupName,
            members: decoded.members,
            messages: [],
            createdBy: decoded.senderIdentity
          }
          setGroupChats(prev => {
            if (prev.find(g => g.id === newGroup.id)) return prev
            return [...prev, newGroup]
          })
        }
      } catch (e) {}
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room, currentIdentity, currentName, selectedPeer, selectedGroup])

  const sendTypingIndicator = useCallback((recipientId: string) => {
    if (!room) return
    try {
      const payload = JSON.stringify({
        type: 'DM_TYPING',
        senderIdentity: currentIdentity,
        senderName: currentName
      })
      const bytes = new TextEncoder().encode(payload)
      room.localParticipant.publishData(bytes, {
        reliable: false,
        destinationIdentities: [recipientId]
      })
    } catch {}
  }, [room, currentIdentity, currentName])

  const sendReadReceipt = useCallback((senderId: string) => {
    if (!room) return
    try {
      const payload = JSON.stringify({
        type: 'DM_READ_RECEIPT',
        senderIdentity: currentIdentity
      })
      const bytes = new TextEncoder().encode(payload)
      room.localParticipant.publishData(bytes, {
        reliable: true,
        destinationIdentities: [senderId]
      })
    } catch {}
  }, [room, currentIdentity])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !room) return

    const text = messageInput.trim()

    if (selectedPeer) {
      const recipientId = selectedPeer.identity
      const dm: DirectMessage = {
        id: Math.random().toString(),
        senderIdentity: currentIdentity,
        senderName: currentName,
        recipientIdentity: recipientId,
        recipientName: getDisplayName(recipientId),
        text,
        timestamp: Date.now(),
        isMe: true,
        delivered: false,
        read: false
      }

      setMessages((prev) => ({
        ...prev,
        [recipientId]: [...(prev[recipientId] || []), dm]
      }))

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

        // Mark as delivered
        setTimeout(() => {
          setMessages(prev => {
            const updated = { ...prev }
            if (updated[recipientId]) {
              updated[recipientId] = updated[recipientId].map(m =>
                m.id === dm.id ? { ...m, delivered: true } : m
              )
            }
            return updated
          })
        }, 200)
      } catch (err) {
        console.error('Failed to send direct message:', err)
      }
    }

    if (selectedGroup) {
      const dm: DirectMessage = {
        id: Math.random().toString(),
        senderIdentity: currentIdentity,
        senderName: currentName,
        recipientIdentity: selectedGroup.id,
        recipientName: selectedGroup.name,
        text,
        timestamp: Date.now(),
        isMe: true,
        delivered: true,
        read: false
      }

      setGroupChats(prev => prev.map(g =>
        g.id === selectedGroup.id ? { ...g, messages: [...g.messages, dm] } : g
      ))

      try {
        const targets = selectedGroup.members.filter(m => m !== currentIdentity)
        const payload = JSON.stringify({
          type: 'GROUP_MESSAGE',
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          senderIdentity: currentIdentity,
          senderName: currentName,
          text
        })
        const bytes = new TextEncoder().encode(payload)
        room.localParticipant.publishData(bytes, {
          reliable: true,
          destinationIdentities: targets
        })
      } catch (err) {
        console.error('Failed to send group message:', err)
      }
    }

    setMessageInput('')
  }

  const handleCreateGroup = () => {
    if (!groupNameInput.trim() || selectedGroupMembers.length === 0 || !room) return

    const groupId = `grp_${Math.random().toString(36).substring(2, 9)}`
    const members = [...selectedGroupMembers, currentIdentity]
    const newGroup: GroupChat = {
      id: groupId,
      name: groupNameInput.trim(),
      members,
      messages: [],
      createdBy: currentIdentity
    }

    setGroupChats(prev => [...prev, newGroup])

    // Notify all members
    try {
      const targets = selectedGroupMembers
      const payload = JSON.stringify({
        type: 'GROUP_INVITE',
        groupId,
        groupName: newGroup.name,
        members,
        senderIdentity: currentIdentity,
        senderName: currentName
      })
      const bytes = new TextEncoder().encode(payload)
      room.localParticipant.publishData(bytes, {
        reliable: true,
        destinationIdentities: targets
      })
    } catch {}

    setShowCreateGroup(false)
    setGroupNameInput('')
    setSelectedGroupMembers([])
    setSelectedGroup(newGroup)
    setActiveView('group')
  }

  const handleSelectPeer = (peer: any) => {
    setSelectedPeer(peer)
    setSelectedGroup(null)
    setActiveView('dm')
    setUnreadCounts((prev) => ({
      ...prev,
      [peer.identity]: 0
    }))
    sendReadReceipt(peer.identity)
  }

  const handleSelectGroup = (group: GroupChat) => {
    setSelectedGroup(group)
    setSelectedPeer(null)
    setActiveView('group')
    setUnreadCounts(prev => ({
      ...prev,
      [group.id]: 0
    }))
  }

  const formatTimestamp = (ts: number) => {
    const diff = (Date.now() - ts) / 1000
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  // Active Chat View (DM or Group)
  if (activeView === 'dm' && selectedPeer) {
    const peerId = selectedPeer.identity
    const conversation = messages[peerId] || []
    const isTyping = typingUsers[peerId] || false

    return (
      <div className="flex flex-col h-full bg-slate-950/60 border-l border-white/10">
        {/* Conversation Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setSelectedPeer(null); setActiveView('list') }}
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
              <span className="text-[10px] text-emerald-400 font-mono">
                {isTyping ? 'typing...' : 'Private DM'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {conversation.length === 0 && (
              <p className="text-center text-xs text-slate-500 my-8">
                Start of your private conversation with {getDisplayName(peerId)}.
              </p>
            )}

            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5">
                  {formatTimestamp(msg.timestamp)}
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
                {/* Read receipts */}
                {msg.isMe && (
                  <span className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-0.5">
                    {msg.read ? (
                      <><CheckCheck className="w-3 h-3 text-blue-400" /> Read</>
                    ) : msg.delivered ? (
                      <><CheckCheck className="w-3 h-3 text-slate-500" /> Delivered</>
                    ) : (
                      <><Check className="w-3 h-3 text-slate-600" /> Sending</>
                    )}
                  </span>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-slate-800 border border-white/10 rounded-2xl rounded-tl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-900/60 flex gap-2">
          <Input
            placeholder={`Message ${getDisplayName(peerId)}...`}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              sendTypingIndicator(peerId)
            }}
            className="bg-slate-900 border-white/10 text-xs text-white"
          />
          <Button type="submit" disabled={!messageInput.trim()} className="bg-blue-600 hover:bg-blue-500">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    )
  }

  // Group Chat View
  if (activeView === 'group' && selectedGroup) {
    const conversation = selectedGroup.messages

    return (
      <div className="flex flex-col h-full bg-slate-950/60 border-l border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setSelectedGroup(null); setActiveView('list') }}
              className="h-7 w-7 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{selectedGroup.name}</span>
              <span className="text-[10px] text-purple-400 font-mono">{selectedGroup.members.length} members</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {conversation.length === 0 && (
              <p className="text-center text-xs text-slate-500 my-8">
                Start of the group conversation. Say hello!
              </p>
            )}

            {conversation.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                {!msg.isMe && (
                  <span className="text-[10px] text-purple-400 font-semibold mb-0.5">{msg.senderName}</span>
                )}
                <span className="text-[10px] text-slate-400 mb-0.5">{formatTimestamp(msg.timestamp)}</span>
                <div className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] break-words shadow-sm ${
                  msg.isMe
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/10'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-900/60 flex gap-2">
          <Input
            placeholder={`Message ${selectedGroup.name}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="bg-slate-900 border-white/10 text-xs text-white"
          />
          <Button type="submit" disabled={!messageInput.trim()} className="bg-purple-600 hover:bg-purple-500">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    )
  }

  // Create Group Modal
  if (showCreateGroup) {
    const otherParticipants = participants.filter(p => p.identity !== currentIdentity)

    return (
      <div className="flex flex-col h-full p-4 space-y-4 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Create Group Chat</h4>
          <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(false)} className="h-7 w-7 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Input
          placeholder="Group name..."
          value={groupNameInput}
          onChange={(e) => setGroupNameInput(e.target.value)}
          className="bg-slate-900 border-white/10 text-xs text-white"
        />

        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Select Members</p>

        <ScrollArea className="flex-1">
          <div className="space-y-1.5">
            {otherParticipants.map(p => {
              const pid = p.identity
              const isSelected = selectedGroupMembers.includes(pid)
              return (
                <button
                  key={pid}
                  onClick={() => {
                    setSelectedGroupMembers(prev =>
                      isSelected ? prev.filter(m => m !== pid) : [...prev, pid]
                    )
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/40 text-white'
                      : 'bg-slate-900/50 hover:bg-slate-800 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase">
                      {getDisplayName(pid).slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold truncate">{getDisplayName(pid)}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                </button>
              )
            })}
          </div>
        </ScrollArea>

        <Button
          onClick={handleCreateGroup}
          disabled={!groupNameInput.trim() || selectedGroupMembers.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-10 rounded-xl gap-1.5"
        >
          <Users className="w-4 h-4" />
          Create Group ({selectedGroupMembers.length} members)
        </Button>
      </div>
    )
  }

  // Peer Select List
  const otherParticipants = participants.filter((p) => p.identity !== currentIdentity)
  const filteredPeers = otherParticipants.filter((p) =>
    getDisplayName(p.identity).toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-slate-950/60">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Direct Messages {totalUnread > 0 && <span className="text-blue-400">({totalUnread} new)</span>}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateGroup(true)}
          className="h-7 text-[10px] text-purple-400 hover:text-purple-300 gap-1"
        >
          <Plus className="w-3 h-3" />
          Group
        </Button>
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
          {/* Group Chats */}
          {groupChats.length > 0 && (
            <>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest pl-1 mt-1 mb-1">Group Chats</p>
              {groupChats.map(group => {
                const unread = unreadCounts[group.id] || 0
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-white/5 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block truncate max-w-36">{group.name}</span>
                        <span className="text-[10px] text-slate-400">{group.members.length} members</span>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
              <div className="h-px bg-white/5 my-2" />
            </>
          )}

          {/* Direct Message Peers */}
          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest pl-1 mt-1 mb-1">Participants</p>
          {filteredPeers.length === 0 && (
            <p className="text-center text-xs text-slate-500 my-6">No other participants online.</p>
          )}

          {filteredPeers.map((p) => {
            const pid = p.identity
            const unread = unreadCounts[pid] || 0
            const lastMsg = messages[pid]?.slice(-1)[0]
            const isTyping = typingUsers[pid] || false

            return (
              <button
                key={pid}
                onClick={() => handleSelectPeer(p)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-white/5 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                      {getDisplayName(pid).slice(0, 2)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-36">
                      {getDisplayName(pid)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-36">
                      {isTyping ? (
                        <span className="text-blue-400">typing...</span>
                      ) : lastMsg ? (
                        <span>{lastMsg.isMe ? 'You: ' : ''}{lastMsg.text.substring(0, 30)}{lastMsg.text.length > 30 ? '...' : ''}</span>
                      ) : (
                        'Click to start DM'
                      )}
                    </span>
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
