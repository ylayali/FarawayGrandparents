export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import dynamicImport from 'next/dynamic'

// Dynamically import the home page content to prevent static generation
const HomePageContent = dynamicImport(
  () => import('./home-page-content').then(mod => mod.HomePageContent),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    )
  }
)

export default function HomePage() {
  return <HomePageContent />
}