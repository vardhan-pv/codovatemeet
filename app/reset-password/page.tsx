'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react'
import { authService } from '@/services/auth'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tokenParam = params.get('token')
      if (tokenParam) {
        setToken(tokenParam)
      } else {
        setFormError('Reset token is missing or invalid. Please check your email link.')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setFormError('Cannot reset password: token is missing.')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setFormError(null)
    setSuccessMsg(null)
    try {
      await authService.resetPassword(password, token)
      setSuccessMsg('Your password has been successfully updated!')
      setIsLoading(false)
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update your password. Please try requesting a new link.')
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
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Choose New Password</h1>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Create a secure, strong password to protect your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                <span>⚠</span> {formError}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span>✓</span> {successMsg}
                </div>
                <Link href="/login" className="mt-2 text-xs font-bold text-white bg-primary hover:bg-[#004fe6] py-2 px-4 rounded-full text-center block w-full transition-all border-none">
                  Sign In to Your Account
                </Link>
              </div>
            )}

            {!successMsg && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      className="pl-11 h-12 bg-input border-border text-white rounded-xl text-sm placeholder:text-muted-foreground/55 focus:border-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || !token}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="password"
                      placeholder="Repeat password"
                      className="pl-11 h-12 bg-input border-border text-white rounded-xl text-sm placeholder:text-muted-foreground/55 focus:border-primary"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading || !token}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 bg-primary hover:bg-[#004fe6] text-white font-extrabold rounded-full text-sm mt-2 transition-all cursor-pointer flex items-center justify-center gap-2"
                  disabled={isLoading || !token}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating password...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">Confirm Reset <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
