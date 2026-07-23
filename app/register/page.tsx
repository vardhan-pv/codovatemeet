'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Mail, Lock, ArrowLeft, Video, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Script from 'next/script'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)
    try {
      const data = await register(name, email, password)
      if (data && data.id) {
        window.location.href = `/login?userId=${data.id}&email=${encodeURIComponent(data.email || email)}&registered=true`
      } else {
        setFormError('Registration failed. Email might already be in use.')
        setIsLoading(false)
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const initializeGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your_google_client_id_here') {
      console.warn('Google Client ID is not configured in environment variables.')
      return
    }

    if (typeof window !== 'undefined' && (window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginSuccess
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'filled_black', size: 'large', width: 384, text: 'signup_with', shape: 'pill' }
        );
      } catch (err) {
        console.error('Error rendering Google sign in button:', err)
      }
    }
  }

  const handleGoogleLoginSuccess = async (googleResponse: any) => {
    setIsLoading(true)
    setFormError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: googleResponse.credential })
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        useAuth.setState({ token: data.token, user: data.user })
        window.location.href = '/dashboard'
      } else {
        setFormError(data.error || 'Google Authentication failed')
        setIsLoading(false)
      }
    } catch {
      setFormError('Failed to verify Google login')
      setIsLoading(false)
    }
  }

  // Initialize Google if script already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      initializeGoogle()
    }
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL (Blue) ── */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-96 h-96 bg-blue-300/20 top-[-60px] right-[-60px]" />
        <div className="absolute rounded-full blur-[100px] pointer-events-none w-64 h-64 bg-indigo-500/20 bottom-10 left-0" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-white/30 relative">
            <Image src="/logo.jpeg" fill className="object-cover" alt="Codovate Meet Logo" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight text-white">Codovate-Meet</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-200">Solutions</span>
          </div>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black text-white leading-tight">
            Your meetings.<br />
            <span className="gradient-text">Elevated.</span>
          </h2>
          <p className="text-blue-100/80 text-base leading-relaxed max-w-sm">
            Create your free account and start hosting professional video meetings in under 60 seconds.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[
              { icon: '🎥', label: 'HD Video' },
              { icon: '💬', label: 'Live Chat' },
              { icon: '🖥️', label: 'Screen Share' },
              { icon: '🔒', label: 'Secured' },
            ].map(f => (
              <div key={f.label} className="glass-card-dark p-3 text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-white/80 text-xs font-semibold">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-200/60 text-xs">© 2026 Codovate Solutions. All rights reserved.</p>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-background">
        <Link href="/" className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground text-sm">Already have one? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium flex items-center gap-2">
                <span>⚠</span> {formError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input type="text" placeholder="John Doe"
                  className="pl-11 h-12"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input type="email" placeholder="you@example.com"
                  className="pl-11 h-12"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input type="password" placeholder="Min. 8 characters"
                  className="pl-11 h-12"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <Button type="submit" size="lg"
              className="w-full h-13 btn-glow text-white font-bold rounded-full text-base mt-2"
              disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Free Account <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">OR</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div id="google-signin-btn" className="w-full max-w-sm flex justify-center"></div>
            <Script
              src="https://accounts.google.com/gsi/client"
              onLoad={initializeGoogle}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By creating an account, you agree to our terms and privacy policy.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
