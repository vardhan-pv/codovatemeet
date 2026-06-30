'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Video, Terminal, GitBranch, Cpu, Sparkles, Layout, 
  MessageSquareCode, Rocket, Shield, Users, CheckCircle, Play
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
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/30">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Video className="h-4 w-4 text-white" strokeWidth={2.5} />
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

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="btn-glow text-white font-bold rounded-lg px-5">
                Start Building Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden hero-gradient">
        {/* Abstract shapes */}
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-[600px] h-[600px] bg-primary/20 top-[-200px] right-[-200px]" />
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-[500px] h-[500px] bg-purple-500/10 bottom-[-100px] left-[-200px]" />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              The AI-Powered Developer Platform
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8"
          >
            Meet. Code. <br className="hidden md:block" />
            <span className="gradient-primary">Deploy Together.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12"
          >
            Not just another video call. Codovate Meet combines HD video conferencing with a shared VS Code workspace, integrated terminal, and an AI Pair Programmer. Build software instantly during your meetings.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold btn-glow text-white">
                Launch Workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/join" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold border-white/10 text-white bg-white/5 hover:bg-white/10 shadow-xl backdrop-blur-md transition-all">
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
          <div className="glass-card-dark p-2 blue-glow ring-1 ring-white/10">
            {/* Fake IDE Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card rounded-t-xl border-b border-white/5">
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
                <Button size="sm" className="h-7 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                  <Play className="w-3 h-3 mr-1" fill="currentColor" /> Live
                </Button>
              </div>
            </div>
            
            {/* Split View */}
            <div className="grid grid-cols-12 gap-0 bg-card rounded-b-xl overflow-hidden h-[500px]">
              {/* Sidebar (Video + Chat) */}
              <div className="col-span-3 border-r border-white/5 flex flex-col bg-secondary">
                <div className="p-3 grid grid-rows-2 gap-2 flex-1">
                  <div className="bg-slate-800 rounded-lg relative overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all" alt="Participant" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white backdrop-blur-md border border-white/10">Alex</span>
                  </div>
                  <div className="bg-slate-800 rounded-lg relative overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all" alt="Participant" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white backdrop-blur-md border border-white/10">You</span>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>
                <div className="p-3 border-t border-white/5 h-1/3 bg-card">
                  <div className="flex items-center gap-2 mb-2 text-xs text-primary font-semibold">
                    <Sparkles className="w-3 h-3" /> AI Assistant
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

      {/* ── LOGOS ── */}
      <section className="py-10 border-b border-white/5 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-6">Built for modern tech stacks</p>
          <div className="flex flex-wrap justify-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simulated Logos */}
            {['Next.js', 'React', 'Docker', 'GitHub', 'Vercel', 'PostgreSQL'].map(tech => (
              <span key={tech} className="text-lg font-bold text-white font-mono tracking-tight">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVELOPER FEATURES ── */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Everything a <span className="gradient-primary">developer needs.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop switching between Zoom, VS Code, and Slack. Codovate Meet brings your entire engineering workflow into one powerful window.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquareCode,
              title: 'Live Shared Editor',
              desc: 'VS Code-like experience in the browser. See cursors, write code together, and resolve conflicts instantly.',
            },
            {
              icon: Sparkles,
              title: 'AI Pair Programmer',
              desc: 'Live bug fixing, code explanation, and auto-generated unit tests right inside your meeting workspace.',
            },
            {
              icon: Terminal,
              title: 'Integrated Terminal',
              desc: 'Run commands, start servers, and view logs together. Fully synchronized sandboxed environments.',
            },
            {
              icon: GitBranch,
              title: 'GitHub Integration',
              desc: 'Pull repositories, create branches, review PRs, and commit changes without leaving the call.',
            },
            {
              icon: Rocket,
              title: 'One-Click Deploy',
              desc: 'Deploy your workspace directly to Vercel, Netlify, or Docker containers instantly.',
            },
            {
              icon: Layout,
              title: 'Advanced Whiteboard',
              desc: 'Infinite canvas for architecture diagrams. Auto-generate UML or flowcharts using meeting context.',
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="premium-card p-8 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── UNIQUE VALUE PROPOSITION ── */}
      <section id="ai" className="py-24 border-y border-white/5 bg-secondary relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                Meeting Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Meetings that write <br />
                <span className="text-muted-foreground">their own code.</span>
              </h2>
              <ul className="space-y-6">
                {[
                  { title: 'Auto-Meeting Summaries', desc: 'Never take notes again. Get action items, decisions made, and technical context extracted automatically.' },
                  { title: 'Meeting-to-Code Conversion', desc: 'Discuss an architecture, and watch our AI generate boilerplate code and architecture diagrams live.' },
                  { title: 'Speaker Insights & Timeline', desc: 'Search past meetings by codebase context, variable names, or technical decisions.' },
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
              <div className="glass-card p-6 relative z-10">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Summary
                  </h3>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">Just now</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <h4 className="text-sm font-semibold text-white mb-2">Decision Made</h4>
                    <p className="text-sm text-muted-foreground">Migrate the authentication service from JWT to NextAuth.js to support GitHub SSO.</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <h4 className="text-sm font-semibold text-primary mb-2">Action Item (Assigned to JD)</h4>
                    <div className="flex items-center gap-3 bg-secondary p-3 rounded border border-white/5">
                      <Terminal className="w-4 h-4 text-muted-foreground" />
                      <code className="text-xs text-slate-300">npm install next-auth @auth/prisma-adapter</code>
                    </div>
                    <Button size="sm" className="w-full mt-3 h-8 text-xs bg-primary hover:bg-primary/90 text-white border-none">Execute Command</Button>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl -z-10 rounded-full opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
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
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold btn-glow text-white border-none">
                Start Building Free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-xl text-base font-bold border-white/10 text-white bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">Codovate Meet</span>
            <span className="opacity-50 ml-2">© 2026</span>
          </div>
          <div className="flex gap-8 font-medium">
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub Sync</Link>
            <Link href="#" className="hover:text-white transition-colors">Enterprise</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
