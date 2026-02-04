export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import dynamicImport from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'

// Dynamically import the real component to prevent static generation
const PurchaseSuccessContent = dynamicImport(
  () => import('./purchase-success-content').then(mod => mod.PurchaseSuccessContent),
  {
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/50 border-white/20">
          <CardContent className="pt-6 text-center">
            <div className="animate-pulse h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
            <p className="text-white/60 text-sm mt-2">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

export default function PurchaseSuccessPage() {
  return <PurchaseSuccessContent />
}
