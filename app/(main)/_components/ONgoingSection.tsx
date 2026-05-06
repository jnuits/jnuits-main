import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'

import { EventProps, OngoingEventCard } from './OngoingEventCard'
import { getOngoingEvents } from '@/actions/EventsActions/EventsManagementAction'
import { AuroraText } from '@/components/ui/aurora-text'

export async function ONgoingSection() {
  const { success, events } = await getOngoingEvents()
  const displayEvents = success && events ? events : []
  // ইভেন্ট কয়টি আছে 
  const eventCount = displayEvents.length

  return (
    <div className="bg-background relative overflow-hidden px-1">
      {/* Background Grid Pattern */}
      <GridPattern
        width={20}
        height={20}
        x={-1}
        y={-1}
        className={cn('z-0 md:mask-x-from-90% md:mask-x-to-95%')}
      />

      {/* Header Section */}
      <div className="my-8 flex items-center justify-center gap-1 relative z-10">
        <div className="h-1 w-14 bg-linear-to-l from-cyan-500 to-transparent" />
        <AuroraText className='text-2xl font-bold md:text-4xl'>Ongoing Events</AuroraText> 
        <div className="h-1 w-14 bg-linear-to-r from-cyan-500 to-transparent" />
      </div>

      {/* Events Container - ডাইনামিক স্টাইলিং */}
      <div
        className={cn(
          'relative z-10 mx-auto w-full gap-6 px-1',
          eventCount === 1 ? 'flex max-w-lg justify-center' :
          eventCount === 2 ? 'grid max-w-4xl grid-cols-1 sm:grid-cols-2' :
          'grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {eventCount > 0 ? (
          displayEvents.map((event) => (
            <OngoingEventCard key={event.id} event={event as EventProps} />
          ))
        ) : (
          // যদি কোনো active event না থাকে
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <p className="text-lg">Currently, there are no ongoing events. Stay tuned!</p>
          </div>
        )}
      </div>

      {/* See All Button */}
      <div className="mx-auto my-8 flex w-full justify-center relative z-10">
        <Link href="/events">
          <Button variant="outline" className="px-5 capitalize">
            See All Events
          </Button>
        </Link>
      </div>
    </div>
  )
}