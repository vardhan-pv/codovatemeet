'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { ArrowLeft, Users, ShieldAlert, Calendar, ShieldCheck, Trash2, Shield } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  is_verified: boolean
  plan: string
}

interface AdminMeeting {
  id: string
  room_name: string
  meeting_code: string
  created_at: string
  scheduled_at?: string
  duration_minutes?: number
  host_name: string
}

interface AdminLog {
  event_type: string
  details: string
  created_at: string
  user_name?: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'meetings' | 'logs'>('users')
  
  // Data lists
  const [usersList, setUsersList] = useState<AdminUser[]>([])
  const [meetingsList, setMeetingsList] = useState<AdminMeeting[]>([])
  const [logsList, setLogsList] = useState<AdminLog[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [user])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/admin/users')
      setUsersList(res.data)
    } catch (e: any) {
      setErrorMsg('Failed to load user list.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMeetings = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/admin/meetings')
      setMeetingsList(res.data)
    } catch (e) {
      setErrorMsg('Failed to load meetings list.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/admin/logs')
      setLogsList(res.data)
    } catch (e) {
      setErrorMsg('Failed to load security audit logs.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'users') fetchUsers()
      else if (activeTab === 'meetings') fetchMeetings()
      else if (activeTab === 'logs') fetchLogs()
    }
  }, [activeTab, user])

  const handleToggleRole = async (targetUser: AdminUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin'
    try {
      await api.put(`/api/admin/users/${targetUser.id}/role`, { role: nextRole })
      setMessage(`Updated ${targetUser.name}'s role to ${nextRole}`)
      fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update user role.')
    }
  }

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will remove all their meetings.')) return
    try {
      await api.delete(`/api/admin/users/${targetUserId}`)
      setMessage('User deleted successfully.')
      fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete user.')
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return
    try {
      await api.delete(`/api/admin/meetings/${meetingId}`)
      setMessage('Meeting deleted successfully.')
      fetchMeetings()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete meeting.')
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#04091e] flex flex-col justify-center items-center text-white font-sans">
        <ShieldAlert className="h-16 w-16 text-rose-500 animate-pulse mb-4" />
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="text-xs text-muted-foreground mt-1">Admin permissions are required to access this dashboard.</p>
        <Link href="/dashboard" className="mt-4 text-xs font-bold bg-primary hover:bg-[#004fe6] py-2 px-6 rounded-full transition-all border-none">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-12 transition-colors duration-200">
      {/* Admin Panel Header */}
      <header className="border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-full transition text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Global Server Administration
            </h1>
          </div>
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
            SuperAdmin
          </span>
        </div>
      </header>

      {/* Main Framework */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tab Selection */}
          <div className="lg:col-span-1 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 transition border-none cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border/40'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Users Management</span>
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 transition border-none cursor-pointer ${
                activeTab === 'meetings'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border/40'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              <span>Meetings Monitoring</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 transition border-none cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border/40'
              }`}
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              <span>Security Auditing Logs</span>
            </button>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-xl"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">System Users</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Edit user roles, check verification states, or delete profiles.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchUsers} className="text-xs h-8 border-none bg-secondary hover:bg-secondary/80 cursor-pointer">Refresh</Button>
                  </div>

                  {message && <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold animate-in fade-in">{message}</div>}
                  {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold animate-in fade-in">⚠ {errorMsg}</div>}

                  <div className="overflow-x-auto border border-border/60 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border font-bold text-foreground">
                          <th className="p-3">User info</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Verified</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading && usersList.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">Loading users...</td></tr>
                        ) : usersList.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">No users registered on the system.</td></tr>
                        ) : (
                          usersList.map((usr) => (
                            <tr key={usr.id} className="border-b border-border/30 hover:bg-secondary/15">
                              <td className="p-3">
                                <div className="font-bold text-foreground">{usr.name}</div>
                                <div className="text-[10px] text-muted-foreground">{usr.email}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${usr.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                                  {usr.role}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-300">{usr.is_verified ? '✅ Yes' : '❌ No'}</td>
                              <td className="p-3 uppercase font-bold text-slate-400">{usr.plan}</td>
                              <td className="p-3 text-right space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRole(usr)}
                                  className="text-xs text-primary hover:underline font-bold transition p-1 cursor-pointer bg-transparent border-none"
                                  title="Toggle Role"
                                >
                                  Swap Role
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(usr.id)}
                                  className="text-rose-400 hover:text-rose-300 transition p-1 bg-transparent border-none cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : activeTab === 'meetings' ? (
                <motion.div
                  key="meetings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-xl"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Active & Scheduled Meetings</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Audit, lock, or delete active codes from the server index.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchMeetings} className="text-xs h-8 border-none bg-secondary hover:bg-secondary/80 cursor-pointer">Refresh</Button>
                  </div>

                  {message && <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold animate-in fade-in">{message}</div>}

                  <div className="overflow-x-auto border border-border/60 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border font-bold text-foreground">
                          <th className="p-3">Room details</th>
                          <th className="p-3">Code</th>
                          <th className="p-3">Scheduled At</th>
                          <th className="p-3">Host User</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading && meetingsList.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">Loading meetings...</td></tr>
                        ) : meetingsList.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">No active meetings scheduled.</td></tr>
                        ) : (
                          meetingsList.map((mt) => (
                            <tr key={mt.id} className="border-b border-border/30 hover:bg-secondary/15">
                              <td className="p-3">
                                <div className="font-bold text-foreground">{mt.room_name || 'Untitled Room'}</div>
                                <div className="text-[10px] text-muted-foreground font-semibold">Duration: {mt.duration_minutes || 60}m</div>
                              </td>
                              <td className="p-3 font-mono font-bold text-primary text-[13px]">{mt.meeting_code}</td>
                              <td className="p-3 font-semibold text-slate-300">
                                {mt.scheduled_at ? new Date(mt.scheduled_at).toLocaleString() : 'Instant'}
                              </td>
                              <td className="p-3 font-semibold text-slate-400">{mt.host_name}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMeeting(mt.id)}
                                  className="text-rose-400 hover:text-rose-300 transition p-1 bg-transparent border-none cursor-pointer"
                                  title="Delete Meeting"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-xl"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Security Audit Logs</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Global access activities, role modifications, and room locking records.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchLogs} className="text-xs h-8 border-none bg-secondary hover:bg-secondary/80 cursor-pointer">Refresh</Button>
                  </div>

                  <div className="overflow-x-auto border border-border/60 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border font-bold text-foreground">
                          <th className="p-3">Event</th>
                          <th className="p-3">Details</th>
                          <th className="p-3">User Executing</th>
                          <th className="p-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading && logsList.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-semibold">Loading audit logs...</td></tr>
                        ) : logsList.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-semibold">No recent logs recorded.</td></tr>
                        ) : (
                          logsList.map((log, idx) => (
                            <tr key={idx} className="border-b border-border/30 hover:bg-secondary/15">
                              <td className="p-3 font-bold text-primary">{log.event_type}</td>
                              <td className="p-3 text-muted-foreground">{log.details}</td>
                              <td className="p-3 text-slate-300 font-semibold">{log.user_name || 'System / Social'}</td>
                              <td className="p-3 text-slate-400">
                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
