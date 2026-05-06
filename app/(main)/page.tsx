import { Metadata } from 'next'

import { CallToAction } from './_components/CallToAction'
import { HeroCarousel } from './_components/HeroCarousel'
import { TopMembersMainComponent } from './_components/TopMemberMainComponent'
import { ONgoingSection } from './_components/ONgoingSection'

export const metadata: Metadata = {
  title: 'Home | JNUITS',
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroCarousel />
        <ONgoingSection />
        <TopMembersMainComponent />
        <CallToAction />
      </main>
    </div>
  )
}
