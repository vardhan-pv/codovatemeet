'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { billingService } from '@/services/billing'
import {
  Check, X, Sparkles, Shield, Zap, Globe, Terminal, 
  HelpCircle, ChevronDown, CheckCircle, ArrowRight
} from 'lucide-react'

// FAQ Data
const faqData = [
  {
    question: "Can I use Codovate Meet for free?",
    answer: "Yes. You can use the Free plan forever. It includes essential capabilities like up to 5 participants, 60-minute meetings, HD video, and shared code editing."
  },
  {
    question: "Can I upgrade anytime?",
    answer: "Yes. You can upgrade, downgrade, or cancel your subscription whenever you want directly from your billing profile page."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes. Every paid plan (Pro and Team) includes a 14-day free trial, allowing you to test premium features risk-free."
  },
  {
    question: "Do you charge per user?",
    answer: "Free, Pro, and Team plans are seat-based. AI usage is included up to your plan limits, with optional add-on credits available if needed. This hybrid pricing model provides predictable subscriptions while balancing AI compute costs."
  },
  {
    question: "Is my code secure?",
    answer: "Yes. Security is our top priority. We use end-to-end encrypted meetings, secure sandboxed cloud storage, GDPR-ready servers, and enterprise-grade security controls."
  }
]

// Comparison Table Data
const comparisonFeatures = [
  { name: 'HD Video', free: true, pro: true, team: true, enterprise: true },
  { name: 'AI Pair Programmer', free: false, pro: true, team: true, enterprise: true },
  { name: 'Live Code Editor', free: true, pro: true, team: true, enterprise: true },
  { name: 'Integrated Terminal', free: false, pro: true, team: true, enterprise: true },
  { name: 'Meeting Recording', free: false, pro: true, team: true, enterprise: true },
  { name: 'AI Meeting Notes', free: false, pro: true, team: true, enterprise: true },
  { name: 'GitHub Integration', free: false, pro: false, team: true, enterprise: true },
  { name: 'Team Dashboard', free: false, pro: false, team: true, enterprise: true },
  { name: 'Custom Branding', free: false, pro: false, team: true, enterprise: true },
  { name: 'SSO', free: false, pro: false, team: false, enterprise: true },
  { name: 'Dedicated AI', free: false, pro: false, team: false, enterprise: true },
]

export default function PricingPage() {
  const { user, token, loadProfile } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Price calculations
  const getProPrice = () => (billingPeriod === 'yearly' ? '₹399' : '₹499')
  const getTeamPrice = () => (billingPeriod === 'yearly' ? '₹1,199' : '₹1,499')

  const handlePlanSelect = async (planId: string) => {
    if (!token) {
      alert("Please sign in or register to choose a plan.")
      window.location.href = '/login'
      return
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@codovatesolutions.in'
      return
    }

    if (user?.plan === planId) {
      alert(`You are already subscribed to the ${planId} plan.`)
      return
    }

    const confirmChange = confirm(`Are you sure you want to subscribe to the ${planId.toUpperCase()} plan (${billingPeriod})?`)
    if (!confirmChange) return

    try {
      await billingService.subscribe(planId, billingPeriod)
      await loadProfile()
      alert(`🎉 Successfully subscribed to the ${planId.toUpperCase()} plan!`)
    } catch (e) {
      console.error("Subscription failed:", e)
      alert("Billing process simulation failed. Please try again.")
    }
  }

  const handleAddonSelect = async (addonName: string, price: string) => {
    if (!token) {
      alert("Please sign in or register to buy add-ons.")
      window.location.href = '/login'
      return
    }

    const confirmChange = confirm(`Would you like to purchase the "${addonName}" add-on for ${price}?`)
    if (!confirmChange) return

    try {
      await billingService.purchaseAddon(addonName)
      await loadProfile()
      alert(`🎉 Successfully purchased ${addonName} add-on!`)
    } catch (e) {
      console.error("Add-on purchase failed:", e)
      alert("Billing process simulation failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-[#e4e4e7] overflow-x-hidden font-sans pt-24 pb-20 selection:bg-primary/30">
      
      {/* Abstract Background Accents */}
      <div className="absolute rounded-full blur-[120px] pointer-events-none w-[500px] h-[500px] bg-primary/10 top-[10%] right-[-100px]" />
      <div className="absolute rounded-full blur-[120px] pointer-events-none w-[400px] h-[400px] bg-purple-500/5 top-[40%] left-[-200px]" />
      
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#08080a]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg bg-white/10 border border-white/10">
              <img src="/logo.png" className="w-full h-full object-cover" alt="Codovate Meet Logo" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-primary transition-colors">
              Codovate Meet
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/#features" className="text-muted-foreground hover:text-white transition-colors">Features</Link>
            <Link href="/#ai" className="text-muted-foreground hover:text-white transition-colors">AI Pair Programmer</Link>
            <Link href="/pricing" className="text-white transition-colors font-bold">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg text-xs sm:text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/95 text-white font-bold rounded-lg px-4 text-xs sm:text-sm">
                Start Building Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <div className="relative max-w-5xl mx-auto px-6 text-center mt-12 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3 h-3" /> Pricing Strategy
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Simple, Transparent Pricing <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">for Every Developer Team</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Choose the perfect plan for your coding meetings. Start free and upgrade as your team grows.
        </p>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center items-center gap-4">
          <span className={`text-sm font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>
            Monthly
          </span>
          
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 bg-zinc-800 border border-zinc-700 rounded-full p-1 transition-colors relative flex items-center cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Toggle billing Period"
          >
            <div
              className={`w-6 h-6 bg-primary rounded-full transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${billingPeriod === 'yearly' ? 'text-white font-bold' : 'text-slate-400'}`}>
            Yearly
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* ── PRICING CARDS ── */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        
        {/* FREE PLAN */}
        <div className="bg-[#1e1e22] border border-[#3f3f46] rounded-[24px] p-6 flex flex-col justify-between hover:border-zinc-500 transition-all duration-300">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Free</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-slate-400 text-xs font-medium">/month</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Perfect for students and individual developers.
            </p>
            <div className="h-px bg-zinc-800 my-6" />
            <ul className="space-y-3.5 text-xs text-slate-300">
              {['5 Participants', '60-minute meetings', 'HD Video', 'Screen Sharing', 'Chat', 'Shared Code Editor', '1 Workspace', '20 AI prompts/month', 'Community Support'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button 
              onClick={() => handlePlanSelect('free')}
              className={`w-full h-11 rounded-xl font-bold border transition-colors ${
                (user?.plan || 'free') === 'free'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default hover:bg-emerald-500/10'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              }`}
            >
              {(user?.plan || 'free') === 'free' ? 'Current Plan' : 'Start Free'}
            </Button>
          </div>
        </div>

        {/* PRO PLAN */}
        <div className="bg-[#1e1e22] border-2 border-primary rounded-[24px] p-6 flex flex-col justify-between relative shadow-[0_0_40px_rgba(37,99,235,0.15)] hover:shadow-[0_0_50px_rgba(37,99,235,0.25)] transition-all duration-300">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-primary/20">
            🔥 Most Popular
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-primary tracking-wider">Pro ⭐</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">{getProPrice()}</span>
              <span className="text-slate-400 text-xs font-medium">/month</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Everything you need for professional coding meetings.
            </p>
            <div className="h-px bg-zinc-800 my-6" />
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="font-bold text-white text-[11px] uppercase tracking-wider mb-2">Everything in Free +</li>
              {['25 Participants', 'Unlimited Meetings', 'AI Pair Programmer', 'AI Code Suggestions', 'Integrated Terminal', 'Multi-file Workspace', 'Live Collaboration', 'Meeting Recording', 'AI Meeting Notes', 'Screen Annotation', '500 AI prompts/month', '50GB Cloud Storage', 'Priority Support'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button 
              onClick={() => handlePlanSelect('pro')}
              className={`w-full h-11 rounded-xl font-bold border-none shadow-md transition-colors ${
                user?.plan === 'pro'
                  ? 'bg-emerald-500/20 text-emerald-400 cursor-default hover:bg-emerald-500/20'
                  : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
              }`}
            >
              {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>

        {/* TEAM PLAN */}
        <div className="bg-[#1e1e22] border border-[#3f3f46] rounded-[24px] p-6 flex flex-col justify-between hover:border-zinc-500 transition-all duration-300">
          <div>
            <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">Team</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">{getTeamPrice()}</span>
              <span className="text-slate-400 text-xs font-medium">/month</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Built for startups and growing engineering teams.
            </p>
            <div className="h-px bg-zinc-800 my-6" />
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="font-bold text-white text-[11px] uppercase tracking-wider mb-2">Everything in Pro +</li>
              {['100 Participants', 'Unlimited AI Prompts', 'Unlimited Workspaces', 'Team Dashboard', 'Member Management', 'Admin Controls', 'Analytics', 'Organization Recording', 'Custom Branding', 'API Access', 'GitHub Integration', 'Jira Integration', 'Slack Integration', '500GB Storage', 'Premium Support'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button 
              onClick={() => handlePlanSelect('team')}
              className={`w-full h-11 rounded-xl font-bold border-none shadow-md transition-colors ${
                user?.plan === 'team'
                  ? 'bg-emerald-500/20 text-emerald-400 cursor-default hover:bg-emerald-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/10'
              }`}
            >
              {user?.plan === 'team' ? 'Current Plan' : 'Start Team Trial'}
            </Button>
          </div>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className="bg-[#1e1e22] border border-[#3f3f46] rounded-[24px] p-6 flex flex-col justify-between hover:border-zinc-500 transition-all duration-300">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Enterprise</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">Custom Pricing</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Designed for large scale tech organizations.
            </p>
            <div className="h-px bg-zinc-800 my-6" />
            <ul className="space-y-3.5 text-xs text-slate-300">
              {['Unlimited Participants', 'Dedicated Servers', 'SSO Login', 'SCIM Provisioning', 'SOC 2 Security', 'Private AI Models', 'Dedicated Success Manager', 'SLA 99.99%', 'Custom Integrations', 'On-premise Deployment', 'Unlimited Storage', 'Custom AI Training'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button 
              onClick={() => handlePlanSelect('enterprise')}
              className={`w-full h-11 rounded-xl font-bold border transition-colors ${
                user?.plan === 'enterprise'
                  ? 'bg-emerald-500/20 text-emerald-400 cursor-default hover:bg-emerald-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              }`}
            >
              {user?.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
            </Button>
          </div>
        </div>

      </div>

      {/* ── ADD-ONS SECTION ── */}
      <div className="max-w-4xl mx-auto px-6 mb-28">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Flexible Add-ons</h2>
          <p className="text-xs text-slate-400 mt-1">Scale features selectively as your workspace needs grow</p>
        </div>
        
        <div className="bg-[#1e1e22] border border-[#3f3f46] rounded-[20px] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 border-b border-[#3f3f46]">
                <th className="p-4 font-bold text-white">Feature</th>
                <th className="p-4 font-bold text-white text-right">Price & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {[
                { name: 'Extra AI Credits', price: '₹199/month' },
                { name: 'AI Meeting Summary', price: '₹99/month' },
                { name: '100GB Storage', price: '₹149/month' },
                { name: 'Webinar (500 attendees)', price: '₹999/month' },
                { name: 'Extra Workspace', price: '₹99/month' },
                { name: 'Priority Support', price: '₹299/month' }
              ].map((addon, index) => (
                <tr key={index} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-300">{addon.name}</td>
                  <td className="p-4 text-right flex items-center justify-end gap-3 h-full">
                    <span className="font-bold text-white">{addon.price}</span>
                    <Button 
                      onClick={() => handleAddonSelect(addon.name, addon.price)}
                      size="sm" 
                      className="h-6 text-[9px] bg-primary/25 hover:bg-primary text-white border-none rounded px-2"
                    >
                      Buy Add-on
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <div className="max-w-5xl mx-auto px-6 mb-28 hidden md:block">
        <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-10">Compare Plan Features</h2>
        
        <div className="bg-[#1e1e22] border border-[#3f3f46] rounded-[24px] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 border-b border-[#3f3f46]">
                <th className="p-4 font-bold text-white w-2/5">Features</th>
                <th className="p-4 font-bold text-white text-center">Free</th>
                <th className="p-4 font-bold text-white text-center">Pro</th>
                <th className="p-4 font-bold text-white text-center">Team</th>
                <th className="p-4 font-bold text-white text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {comparisonFeatures.map((feat, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-200">{feat.name}</td>
                  <td className="p-4 text-center">
                    {feat.free ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-4 text-center">
                    {feat.pro ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-4 text-center">
                    {feat.team ? <Check className="w-4 h-4 text-purple-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-4 text-center">
                    {feat.enterprise ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TRUST SECTION ── */}
      <div className="bg-[#1e1e22]/40 border-y border-[#3f3f46] py-12 mb-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6">★★★★★ Trusted by Developers Worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 justify-center items-center text-xs text-slate-300 font-semibold">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <span>🔒 End-to-End Encryption</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>⚡ 99.9% Uptime</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
              <span>🤖 AI Powered</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400 shrink-0" />
              <span>🌍 Global Infrastructure</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400 shrink-0" />
              <span>💻 VS Code-like Experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ SECTION ── */}
      <div className="max-w-3xl mx-auto px-6 mb-28">
        <h2 className="text-3xl font-black text-white text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((faq, idx) => {
            const isExpanded = expandedFaq === idx
            return (
              <div 
                key={idx}
                className="bg-[#1e1e22] border border-[#3f3f46] rounded-[16px] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left border-none bg-transparent outline-none cursor-pointer"
                >
                  <span className="font-bold text-sm text-white flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-zinc-800/80 text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-primary/20 p-10 rounded-[32px] shadow-[0_0_50px_rgba(99,102,241,0.05)] relative overflow-hidden">
          <div className="absolute rounded-full blur-[80px] w-64 h-64 bg-primary/10 bottom-[-100px] right-[-100px] pointer-events-none" />
          
          <h2 className="text-3xl font-black text-white mb-4">Ready to Build Together?</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            Join thousands of developers using Codovate Meet for collaborative coding and AI-assisted development.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="mailto:sales@codovatesolutions.in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
