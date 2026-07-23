'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import { authService } from '@/services/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)
    setSuccessMsg(null)
    try {
      await authService.forgotPassword(email)
      setSuccessMsg('Reset password link has been sent to your email address!')
      setIsLoading(false)
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to request password reset. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#04091e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/login" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm font-bold self-start pl-4 sm:pl-0">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border py-8 px-6 shadow-2xl rounded-3xl sm:px-10 text-white animate-in fade-in duration-300"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Reset Password</h1>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                <span>⚠</span> {formError}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                <span>✓</span> {successMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-11 h-12 bg-input border-border text-white rounded-xl text-sm placeholder:text-muted-foreground/55 focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || !!successMsg}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 bg-primary hover:bg-[#004fe6] text-white font-extrabold rounded-full text-sm mt-2 transition-all cursor-pointer flex items-center justify-center gap-2"
              disabled={isLoading || !!successMsg}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending link...
                </span>
              ) : (
                <span className="flex items-center gap-2">Send Reset Link <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
