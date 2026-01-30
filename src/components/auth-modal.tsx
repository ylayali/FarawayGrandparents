'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Check, Shield } from 'lucide-react'
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/auth-context'
import { getTrialPackage } from '@/lib/credit-packages'
import { getAccount } from '@/lib/appwrite'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp, user } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleModeSwitch = () => {
    resetForm()
    setIsSignUp(!isSignUp)
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!password.trim()) {
      setError('Password is required')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Full name is required')
        return false
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (isSignUp) {
        // Create account with client-side signup
        const { error: signUpError } = await signUp(email.trim(), password, fullName.trim())
        
        if (signUpError) {
          setError(signUpError instanceof Error ? signUpError.message : 'Failed to create account')
          setIsLoading(false)
          return
        }

        // Account created successfully - get user ID directly from account
        const account = getAccount()
        const currentUser = await account.get()
        
        // Now redirect to Stripe checkout
        const trialPackage = getTrialPackage()
        
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.$id,
            packageId: trialPackage.id,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to create checkout session')
          setIsLoading(false)
          return
        }

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          setError(error instanceof Error ? error.message : 'Failed to sign in')
        } else {
          handleClose()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isSignUp ? 'Start Creating Memories' : 'Sign In'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {isSignUp 
              ? 'Join the family and create personalized coloring pages for your grandchildren'
              : 'Sign in to your account to access your credits and coloring pages'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/40 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-900/20 border border-red-500/50 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-900/20 border border-green-500/50 p-3">
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {isSignUp && (
            <>
              {/* Trial Package Details */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/40 rounded-lg p-4 space-y-3">
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg">🎁 Family Keepsake Trial</h3>
                  <p className="text-blue-200 text-sm mt-1">
                    $7.99 for 5 credits, then $14.99/month for 10 credits
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-200">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>5 coloring page credits to start</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>15-day trial period</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Then 10 credits/month automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime</span>
                  </div>
                </div>

                {/* Money-back Guarantee */}
                <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-300 text-sm">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <p className="font-medium">
                      30-Day Money-Back Guarantee
                    </p>
                  </div>
                  <p className="text-green-200 text-xs mt-1 ml-6">
                    Not delighted? We'll refund your payment within 30 days, no questions asked!
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading 
                  ? 'Setting Up Your Account...'
                  : 'Start Your Trial'
                }
              </Button>

              <p className="text-xs text-white/50 text-center">
                By continuing, you agree to our subscription terms. Your account will be charged $7.99 today and $14.99/month after your 15-day trial.
              </p>
            </>
          )}

          {!isSignUp && (
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              disabled={isLoading}
              className="text-sm text-white/60 hover:text-white underline disabled:no-underline disabled:hover:text-white/60"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
