'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Coins, Home } from 'lucide-react'
import { useAuth } from '@/components/auth-context'

function PurchaseSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, signIn } = useAuth()
  const [loading, setLoading] = useState(true)
  const [autoSigningIn, setAutoSigningIn] = useState(false)
  const sessionId = searchParams.get('session_id')
  const isNewUser = searchParams.get('new_user') === 'true'

  useEffect(() => {
    const processPurchase = async () => {
      // Check if this is a new user who needs to be signed in
      if (isNewUser && !user) {
        const email = sessionStorage.getItem('signup_email')
        const password = sessionStorage.getItem('signup_password')
        
        if (email && password) {
          setAutoSigningIn(true)
          try {
            await signIn(email, password)
            // Clear credentials from storage
            sessionStorage.removeItem('signup_email')
            sessionStorage.removeItem('signup_password')
          } catch (error) {
            console.error('Auto sign-in failed:', error)
          }
          setAutoSigningIn(false)
        }
      }
      
      // Small delay to ensure webhook has processed
      const timer = setTimeout(() => {
        setLoading(false)
      }, 2000)

      return () => clearTimeout(timer)
    }

    processPurchase()
  }, [isNewUser, user, signIn])

  if (autoSigningIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/50 border-white/20">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="animate-pulse h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
            <p className="text-white">Signing you in...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user && !isNewUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/50 border-white/20">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-white">Please sign in to view your purchase.</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user && isNewUser && !autoSigningIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/50 border-white/20">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-white">Setting up your account...</p>
            <p className="text-white/60 text-sm">Please sign in to continue.</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-black/50 border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-xl text-white">Payment Successful!</CardTitle>
          <CardDescription className="text-white/60">
            Your credits have been added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {loading ? (
            <div className="space-y-2">
              <div className="animate-pulse h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
              <p className="text-white/60 text-sm">Processing your purchase...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">Credits Added Successfully!</span>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  Your credits have been added to your account
                </p>
              </div>
              
              <div className="text-white/80 text-sm">
                <p>Purchase ID: {sessionId?.slice(-8)}</p>
                <p className="text-xs text-white/60 mt-1">
                  Keep this for your records
                </p>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => router.push('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Start Creating Coloring Pages
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/50 border-white/20">
          <CardContent className="pt-6 text-center">
            <div className="animate-pulse h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
            <p className="text-white/60 text-sm mt-2">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  )
}
