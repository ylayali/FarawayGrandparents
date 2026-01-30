'use client'

import { getAccount, getDatabases } from '@/lib/appwrite'
import { Models } from 'appwrite'
import { createContext, useContext, useEffect, useState } from 'react'
import { ID } from 'appwrite'

type AuthContextType = {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: unknown }>
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<{ error: unknown }>
  resetPassword: (email: string) => Promise<{ error: unknown }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const account = getAccount()
        const currentUser = await account.get()
        setUser(currentUser)
        
        // Store session in cookie for server-side usage
        const session = await account.getSession('current')
        document.cookie = `appwrite-session=${session.secret}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=strict`
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const account = getAccount()
      const databases = getDatabases()
      
      // Create account
      const newUser = await account.create(
        ID.unique(),
        email,
        password,
        fullName
      )
      
      // Sign in to create session
      await account.createEmailPasswordSession(email, password)
      
      // Create user profile in database
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        newUser.$id,
        {
          email: email,
          full_name: fullName,
          credits: 3,
          subscription_tier: 'free'
        }
      )
      
      // Update local state
      const currentUser = await account.get()
      setUser(currentUser)
      
      // Store session in cookie
      const session = await account.getSession('current')
      document.cookie = `appwrite-session=${session.secret}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=strict`
      
      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const account = getAccount()
      await account.createEmailPasswordSession(email, password)
      
      // Update local state
      const currentUser = await account.get()
      setUser(currentUser)
      
      // Store session in cookie
      const session = await account.getSession('current')
      document.cookie = `appwrite-session=${session.secret}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=strict`
      
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const account = getAccount()
      await account.deleteSession('current')
      setUser(null)
      
      // Clear session cookie
      document.cookie = 'appwrite-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const account = getAccount()
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      )
      return { error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
