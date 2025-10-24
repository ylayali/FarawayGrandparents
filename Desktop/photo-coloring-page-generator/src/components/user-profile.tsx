'use client'

import { useAuth } from './auth-context'
import { getDatabases } from '@/lib/appwrite'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { User, LogOut, Coins, Crown, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Query } from 'appwrite'

type ProfileData = {
  credits: number
  subscription_tier: string
}

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const databases = getDatabases()
        const response = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
          user.$id
        )

        setProfile({
          credits: response.credits,
          subscription_tier: response.subscription_tier
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  async function refreshCredits() {
    if (!user) return

    try {
      const databases = getDatabases()
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        user.$id
      )

      setProfile({
        credits: response.credits,
        subscription_tier: response.subscription_tier
      })
    } catch (error) {
      console.error('Error refreshing credits:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return <div className="text-gray-400">Loading...</div>
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'pro':
        return <Star className="w-4 h-4 text-blue-400" />
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Credits Display Box */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-900/20 px-4 py-2">
        <Coins className="w-5 h-5 text-amber-400" />
        <div className="flex flex-col">
          <span className="text-xs text-amber-300/70">Credits</span>
          <span className="text-lg font-bold text-amber-400">{profile?.credits ?? 0}</span>
        </div>
      </div>
      
      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 hover:text-white"
          >
            <User className="w-4 h-4 mr-2" />
            {user?.name || user?.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
          <DropdownMenuLabel className="text-gray-200">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem 
            className="text-gray-200 focus:bg-gray-800 focus:text-white cursor-pointer"
            onClick={refreshCredits}
          >
            <Coins className="w-4 h-4 mr-2" />
            <span className="flex-1">Credits: {profile?.credits ?? 0}</span>
            {profile?.subscription_tier && getTierIcon(profile.subscription_tier)}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem 
            className="text-red-400 focus:bg-gray-800 focus:text-red-300 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
