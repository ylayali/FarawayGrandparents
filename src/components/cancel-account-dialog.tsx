'use client'

import { useState } from 'react'
import { AlertTriangle, Mail, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CancelAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function CancelAccountDialog({ isOpen, onClose, userId }: CancelAccountDialogProps) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelDate, setCancelDate] = useState<string | null>(null)

  const handleConfirm = async () => {
    setCancelling(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel subscription')
        setCancelling(false)
        return
      }

      setCancelDate(data.keepAccessUntil)
      setCancelled(true)
      
      setTimeout(() => {
        setCancelled(false)
        setCancelDate(null)
        onClose()
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setCancelling(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-red-900/20 to-orange-900/20 border-2 border-red-500/50">
        {!cancelled ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-full bg-red-500/20 border-2 border-red-500">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-white text-center">
                Cancel Your Subscription?
              </DialogTitle>
              <DialogDescription className="text-white/80 text-center pt-2">
                Are you sure you want to cancel?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-5 my-4">
              <p className="text-red-100 text-center leading-relaxed">
                <strong className="text-red-200 text-lg block mb-3">
                  ⚠️ You're about to lose your ability to bond with your grandchild through super-personalized coloring pages
                </strong>
                <span className="text-sm text-red-200">
                  These are the precious moments and keepsakes that create lasting memories. Are you certain you want to cancel?
                </span>
              </p>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-100 text-sm">
                    <strong>Need help with payment?</strong>
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    If you're having trouble with payment, please email us at{' '}
                    <a 
                      href="mailto:alan@FarawayGrandparents.com" 
                      className="underline hover:text-white"
                    >
                      alan@FarawayGrandparents.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={cancelling}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Keep Creating Memories
              </Button>
              <Button
                onClick={handleConfirm}
                variant="destructive"
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-full bg-green-500/20 border-2 border-green-500">
                  <Calendar className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-white text-center">
                Subscription Cancelled
              </DialogTitle>
              <DialogDescription className="text-white/80 text-center pt-2">
                Your recurring payments have been stopped
              </DialogDescription>
            </DialogHeader>

            <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-5 my-4 text-center">
              <p className="text-green-100 text-sm leading-relaxed">
                <strong className="text-green-200 text-lg block mb-3">
                  ✅ Cancellation Successful
                </strong>
                <span className="text-sm text-green-200">
                  Your subscription has been cancelled. You'll keep your account and any remaining credits until{' '}
                  <strong className="text-white">{cancelDate}</strong>
                  <br />
                  <br />
                  After that date, you won't be charged again but can still use the app with any remaining credits or purchase more.
                </span>
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Got it, Thanks
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}