'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-context'
import { createClient } from '@/lib/supabase'
import { User, LogOut, Coins, Crown, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

type UserProfile = {
  id: string
  email: string
  full_name: string
  credits: number
  subscription_tier: 'free' | 'premium' | 'pro'
  created_at: string
}

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          await createProfile()
        } else {
          // For other errors, still show basic UI with sign out option
          setLoading(false)
        }
      } else {
        setProfile(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      // Always allow user to sign out even on error
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return

    try {
      const newProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        credits: 10,
        subscription_tier: 'free' as const,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile creation error:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="h-4 w-4 text-yellow-400" />
      case 'pro':
        return <Star className="h-4 w-4 text-purple-400" />
      default:
        return <User className="h-4 w-4 text-white/60" />
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'Premium'
      case 'pro':
        return 'Pro'
      default:
        return 'Free'
    }
  }

  const getCreditColor = (credits: number) => {
    if (credits >= 10) return 'text-green-400'
    if (credits >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const handleBuyCredits = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        console.error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-white/60">
        <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse"></div>
        <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show a basic profile with sign-out even if profile data failed to load
  if (!profile) {
    return (
      <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">
                  {user.user_metadata?.full_name || user.email || 'User'}
                </CardTitle>
                <CardDescription className="text-xs text-red-300">
                  Profile Error - Please refresh
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                {profile.full_name}
                {getTierIcon(profile.subscription_tier)}
              </CardTitle>
              <CardDescription className="text-xs text-white/60">
                {getTierLabel(profile.subscription_tier)} Plan
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white/80">Credits:</span>
          </div>
          <span className={`text-sm font-semibold ${getCreditColor(profile.credits)}`}>
            {profile.credits}
          </span>
        </div>
        
        {profile.credits <= 2 && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-500/50 rounded-md">
            <p className="text-xs text-red-300 mb-2">
              Low credits! Each coloring page costs 1 credit.
            </p>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={handleBuyCredits}
            >
              <Coins className="h-3 w-3 mr-1" />
              Buy 10 Credits - $7
            </Button>
          </div>
        )}
        
        {profile.subscription_tier === 'free' && profile.credits > 2 && (
          <div className="mt-3">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              onClick={handleBuyCredits}
            >
              <Crown className="h-3 w-3 mr-1" />
              Buy 10 Credits - $7
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
