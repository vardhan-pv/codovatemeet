'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Video, Terminal, GitBranch, Cpu, Zap, Layout, Calendar,
  MessageSquareCode, Rocket, Shield, Users, CheckCircle, Play, Menu, X
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/30">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 bg-white/10 border border-white/10 relative shrink-0">
                <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Meet Logo" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-primary transition-colors">
                  Codovate Meet
                </span>
              </div>
            </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-white transition-colors">Features</Link>
            <Link href="#ai" className="text-muted-foreground hover:text-white transition-colors">AI Pair Programmer</Link>
            <Link href="#workspace" className="text-muted-foreground hover:text-white transition-colors">Live Workspace</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-full px-5">
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="hidden sm:inline-block">
              <Button className="btn-glow text-white font-bold rounded-full px-6">
                Start Building Free
              </Button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden text-white ml-2 bg-white/5 border-white/10 hover:bg-white/10 rounded-full h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-[#030712]/95 backdrop-blur-3xl border-b border-white/5 p-4 flex flex-col gap-4 shadow-2xl">
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-white py-2 px-4 rounded-lg hover:bg-white/5">Features</Link>
            <Link href="#ai" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-white py-2 px-4 rounded-lg hover:bg-white/5">AI Pair Programmer</Link>
            <Link href="#workspace" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-white py-2 px-4 rounded-lg hover:bg-white/5">Live Workspace</Link>
            <div className="h-px bg-white/10 my-2" />
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button variant="ghost" className="w-full justify-start text-base font-medium text-white hover:bg-white/5 rounded-full">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button className="w-full btn-glow text-white font-bold rounded-full">
                Start Building Free
              </Button>
            </Link>
          </div>
        )}
      </nav>
      <main>
        {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden hero-gradient">
        {/* Abstract shapes */}
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-[600px] h-[600px] bg-primary/20 top-[-200px] right-[-200px]" />
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-[500px] h-[500px] bg-purple-500/10 bottom-[-100px] left-[-200px]" />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Announcement Banner */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-8 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
            <span>AI-first note taking & development workspace.</span>
            <Link href="#features" className="text-[#0B5CFF] hover:underline inline-flex items-center gap-1 font-semibold ml-1">
              Explore features <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8"
          >
            Meet. Code. <br className="hidden md:block" />
            <motion.span 
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="gradient-primary inline-block"
            >
              Build Together.
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12"
          >
            Not just another video call. Codovate Meet is the ultimate collaboration workspace where engineering teams connect, communicate, and build side-by-side in real-time. Brainstorm ideas, solve complex problems, and maintain daily developer closeness.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full text-base font-bold btn-glow text-white">
                Launch Workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/join" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-full text-base font-bold border-white/10 text-white bg-white/5 hover:bg-white/10 shadow-xl backdrop-blur-md transition-all">
                <Play className="mr-2 h-4 w-4" /> Join a Session
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero mockup - The IDE Interface */}
        <motion.div
          className="relative z-10 max-w-6xl mx-auto mt-24 px-4 sm:px-6"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, type: "spring", bounce: 0.2 }}
        >
          <div className="glass-card-dark p-2 blue-glow ring-1 ring-white/10 rounded-[24px]">
            {/* Fake IDE Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card rounded-t-[22px] border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">codovate / api-service</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                  <div className="w-7 h-7 rounded-full border-2 border-background bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                </div>
                <Button size="sm" className="h-7 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full">
                  <Play className="w-3 h-3 mr-1" fill="currentColor" /> Live
                </Button>
              </div>
            </div>
            
            {/* Split View */}
            <div className="grid grid-cols-12 gap-0 bg-card rounded-b-[22px] overflow-hidden h-[500px]">
              {/* Sidebar (Video + Chat) */}
              <div className="col-span-3 border-r border-white/5 flex flex-col bg-secondary">
                <div className="p-3 grid grid-rows-2 gap-2 flex-1">
                  <div className="bg-slate-800 rounded-lg relative overflow-hidden group">
                    <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" fill className="object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all" alt="Participant" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white backdrop-blur-md border border-white/10">Alex</span>
                  </div>
                  <div className="bg-slate-800 rounded-lg relative overflow-hidden group">
                    <Image src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=600&auto=format&fit=crop" fill className="object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all" alt="Participant" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white backdrop-blur-md border border-white/10">You</span>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>
                <div className="p-3 border-t border-white/5 h-1/3 bg-card">
                  <div className="flex items-center gap-2 mb-2 text-xs text-primary font-semibold">
                    <Zap className="w-3 h-3" /> AI Assistant
                  </div>
                  <div className="text-[11px] text-muted-foreground bg-white/5 p-2 rounded-md border border-white/5 font-mono">
                    I optimized the Database query on line 42. It should reduce latency by 40%.
                  </div>
                </div>
              </div>
              
              {/* Main Code Area */}
              <div className="col-span-9 flex flex-col relative">
                {/* Tabs */}
                <div className="flex items-center bg-secondary border-b border-white/5">
                  <div className="px-4 py-2 border-r border-white/5 border-t-2 border-t-primary bg-card text-xs font-mono text-white flex items-center gap-2">
                    <Layout className="w-3 h-3 text-blue-400" /> server.ts
                  </div>
                  <div className="px-4 py-2 border-r border-white/5 text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-emerald-400" /> bash
                  </div>
                </div>
                
                {/* Code Content */}
                <div className="flex-1 p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-hidden relative">
                  <div className="flex">
                    <div className="text-slate-600 select-none text-right pr-4 border-r border-white/10 mr-4">
                      {Array.from({length: 15}).map((_, i) => <div key={i}>{i + 1}</div>)}
                    </div>
                    <div>
                      <div className="text-purple-400">import</div> {'{'} serve {'}'} <div className="text-purple-400 inline">from</div> <span className="text-emerald-300">'@hono/node-server'</span><br/>
                      <div className="text-purple-400">import</div> {'{'} Hono {'}'} <div className="text-purple-400 inline">from</div> <span className="text-emerald-300">'hono'</span><br/><br/>
                      <div className="text-blue-400">const</div> app = <div className="text-blue-400 inline">new</div> Hono()<br/><br/>
                      <span className="text-slate-500">// AI Pair Programmer suggestion applied</span><br/>
                      app.<div className="text-yellow-200 inline">get</div>(<span className="text-emerald-300">'/api/users'</span>, <div className="text-purple-400 inline">async</div> (c) <div className="text-blue-400 inline">={'>'}</div> {'{'}<br/>
                      &nbsp;&nbsp;<div className="text-blue-400 inline">const</div> users = <div className="text-purple-400 inline">await</div> db.select().from(User).limit(50)<br/>
                      &nbsp;&nbsp;<div className="text-purple-400 inline">return</div> c.json(users)<br/>
                      {'}'})<br/>
                      <br/>
                      <div className="relative inline-block">
                        <span className="absolute -left-1 w-[2px] h-full bg-primary" />
                        <span className="bg-primary/20 text-white px-1">serve(app, (info) ={'>'} {'{'}</span>
                        <div className="absolute -top-6 left-0 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg">Alex</div>
                      </div><br/>
                      &nbsp;&nbsp;<span className="text-blue-400">console</span>.<span className="text-yellow-200">log</span>(<span className="text-emerald-300">`Listening on http://localhost:<div className="text-blue-300 inline">${'{'}info.port{'}'}</div>`</span>)<br/>
                      {'}'})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>



      {/* ── DEVELOPER FEATURES ── */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Everything your team needs to <span className="gradient-primary">stay connected.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop switching between Zoom, VS Code, and Slack. Codovate Meet combines video conferencing, team communication, and live coding workspaces into one cohesive platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquareCode,
              title: 'Live Shared Editor',
              desc: 'Write and debug code side-by-side. See remote cursors, edit files in real-time, and resolve conflicts in the moment.',
              image: '/code-workspace-3d.png',
            },
            {
              icon: Video,
              title: 'HD Video & Huddles',
              desc: 'High-definition video huddles, crystal-clear audio, reactions, and screen-sharing tailored specifically for tech teams.',
              image: '/video-huddle-3d.png',
            },
            {
              icon: Calendar,
              title: 'Smart Calendar & Sync',
              desc: 'Schedule developer meetings, sync calendar events, set agendas, and coordinate across team time zones.',
              image: '/calendar-schedule-3d.png',
            },
            {
              icon: Zap,
              title: 'AI pair programming',
              desc: 'Draft unit tests, analyze code context, and resolve bugs instantly using our collaborative AI gateway.',
              image: '/ai-copilot-3d.png',
            },
            {
              icon: GitBranch,
              title: 'GitHub Integration',
              desc: 'Pull repositories, create branches, review pull requests, and commit updates without leaving the session.',
            },
            {
              icon: Layout,
              title: 'Advanced Whiteboard',
              desc: 'Infinite visual canvas for architecture design. Auto-generate flowcharts and UMLs to explain your ideas.',
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="premium-card p-8 group flex flex-col justify-between overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  {f.image && (
                    <div className="relative w-14 h-14 opacity-90 group-hover:scale-110 transition-transform duration-300">
                      <Image src={f.image} alt={f.title} fill className="object-contain" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── UNIQUE VALUE PROPOSITION ── */}
      <section id="ai" className="py-16 border-y border-white/5 bg-secondary relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                Meeting Intelligence & Scheduling
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Meetings that write <br />
                <span className="text-muted-foreground">their own code & schedules.</span>
              </h2>
              <ul className="space-y-6">
                {[
                  { title: 'Smart 3D Calendar Scheduling', desc: 'Sync calendar invitations, calculate time zones automatically, and manage developer meeting timelines.' },
                  { title: 'Auto-Meeting Summaries', desc: 'Never take notes again. Get action items, decisions made, and technical context extracted automatically.' },
                  { title: 'Meeting-to-Code Conversion', desc: 'Discuss an architecture, and watch our AI generate boilerplate code and architecture diagrams live.' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="glass-card p-6 relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <Image src="/calendar-schedule-3d.png" alt="Calendar Schedule" fill className="object-contain" />
                    </div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> AI Schedule & Summary
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">Just now</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5 flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0">
                      <Image src="/calendar-schedule-3d.png" alt="Calendar 3D" fill className="object-contain" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Calendar Event Synced</h4>
                      <p className="text-xs text-muted-foreground">Sprint Architecture Sync scheduled for 10:00 AM EST (GMT-5).</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <h4 className="text-sm font-semibold text-primary mb-2">Action Item (Assigned to JD)</h4>
                    <div className="flex items-center gap-3 bg-secondary p-3 rounded border border-white/5">
                      <Terminal className="w-4 h-4 text-muted-foreground" />
                      <code className="text-xs text-slate-300">npm install next-auth @auth/prisma-adapter</code>
                    </div>
                    <Button size="sm" className="w-full mt-3 h-8 text-xs bg-primary hover:bg-primary/90 text-white border-none rounded-full">Execute Command</Button>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl -z-10 rounded-full opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-[800px] h-[800px] bg-primary/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to change how you build?
          </h2>
          <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto">
            Join the next generation of developers building better software together, in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full text-base font-bold btn-glow text-white border-none">
                Start Building Free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-full text-base font-bold border-white/10 text-white bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
      </main>

      {/* ── FAQ SECTION (SEO + AEO Optimization) ── */}
      <section id="faq" className="relative py-16 sm:py-24 bg-[#050816]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-xs font-bold tracking-[0.25em] uppercase block mb-4">Frequently Asked Questions</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Everything you need to know
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Quick answers about Codovate Meet — the AI-powered collaboration platform built for developers and teams.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: 'What is Codovate Meet?',
                a: 'Codovate Meet is an AI-powered collaboration platform for developers and teams. It combines video meetings, a real-time collaborative code editor (similar to VS Code), AI Pair Programmer, interactive whiteboard, screen sharing, and GitHub integration into one seamless workspace. Meet. Code. Build. Deploy Together.'
              },
              {
                q: 'How does the AI Pair Programmer work?',
                a: 'The AI Pair Programmer listens to your meeting context and provides intelligent code suggestions, auto-completions, bug fixes, and explanations directly inside the collaborative code editor. It works alongside you during live meetings, helping your team code faster and smarter.'
              },
              {
                q: 'Is Codovate Meet free to use?',
                a: 'Yes! Codovate Meet offers a free tier with full access to video meetings, collaborative coding, AI assistance, screen sharing, and GitHub integration. No credit card required to get started.'
              },
              {
                q: 'Why choose Codovate Meet over Google Meet or Zoom?',
                a: 'Unlike Google Meet or Zoom, Codovate Meet is purpose-built for developers. It includes a built-in VS Code-style code editor with multi-language support, AI Pair Programmer, GitHub push/pull integration, an interactive whiteboard for architecture diagrams, and real-time code collaboration — features that generic meeting platforms simply don\'t offer.'
              },
              {
                q: 'Is Codovate Meet secure?',
                a: 'Absolutely. All meetings use end-to-end encryption via WebRTC. Your code is never stored on our servers — all communication is peer-to-peer encrypted. We take security and privacy very seriously.'
              },
              {
                q: 'Which programming languages does the code editor support?',
                a: 'The collaborative code editor supports JavaScript, TypeScript, Python, HTML, CSS, C++, Java, Go, Rust, and many more languages. It features syntax highlighting, IntelliSense, bracket pair colorization, and full Monaco Editor capabilities — the same engine that powers VS Code.'
              },
            ].map((item, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-primary/20 transition-all duration-300"
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer select-none text-white font-semibold text-sm sm:text-base hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="text-slate-500 group-open:rotate-45 transition-transform duration-300 text-xl font-light ml-4 shrink-0">+</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#0B0D19]/90 relative overflow-hidden">
        {/* Glow highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            
            {/* Column 1: Branding & Tagline */}
            <div className="lg:col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg bg-white/10 border border-white/10 relative">
                  <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Meet Logo" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-primary transition-colors">
                  Codovate Meet
                </span>
              </Link>
              
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                The ultimate developer communication and collaboration workspace. Meet, connect, and build software side-by-side in real-time.
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {[
                  { 
                    svgPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", 
                    viewBox: "0 0 24 24", 
                    href: 'https://twitter.com/codovatemeet', 
                    label: 'Twitter' 
                  },
                  { 
                    svgPath: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12", 
                    viewBox: "0 0 24 24", 
                    href: 'https://github.com/codovatesolutions', 
                    label: 'GitHub' 
                  },
                  { 
                    svgPath: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z", 
                    viewBox: "0 0 24 24", 
                    href: 'https://linkedin.com/company/codovate', 
                    label: 'LinkedIn' 
                  },
                  {
                    svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z",
                    viewBox: "0 0 24 24",
                    href: 'https://www.instagram.com/codovatemeet?igsh=MThyNXZ2bHE1ajR2Yg==',
                    label: 'Instagram'
                  }
                ].map((s, idx) => (
                  <a
                    key={idx}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all duration-300"
                    aria-label={s.label}
                  >
                    <svg viewBox={s.viewBox} className="h-4 w-4" fill="currentColor">
                      <path d={s.svgPath} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Column 2: Product */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Shared Workspace</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">AI pair programming</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Interactive Whiteboard</Link></li>
              </ul>
            </div>
            
            {/* Column 3: Resources */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Resources</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/#api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="https://github.com/codovatesolutions" className="hover:text-white transition-colors">GitHub Sync</Link></li>
                <li><Link href="/#security" className="hover:text-white transition-colors">Security Audit</Link></li>
              </ul>
            </div>
            
            {/* Column 4: Company */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/#about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/#blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/#enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
                <li><Link href="/#contact" className="hover:text-white transition-colors">Contact Sales</Link></li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom Divider */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2026 Codovate Solutions. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/#privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/#terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <button onClick={() => window.dispatchEvent(new Event('open-cookie-banner'))} className="hover:text-white transition-colors cursor-pointer">Cookie settings</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
