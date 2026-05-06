'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { CldImage } from 'next-cloudinary'

import { CalendarDays, Star, Ticket, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import RegisterButton from '../events/_components/RegisterButton'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType = 'MEMBER_APPLY' | 'WORKSHOP' | 'BCC_COURSE'

export interface EventProps {
  id: string
  title: string
  fee: number
  isPaid: boolean
  type: EventType
  description: string
  image: string
  deadline: Date | string
  isFeatured: boolean
  isPublic: boolean
  TotalApplicants: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_THRESHOLD_DAYS = 3

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseDeadline(deadline: Date | string): Date | null {
  const date = new Date(deadline)
  return isNaN(date.getTime()) ? null : date
}

function formatDeadline(date: Date | null): string {
  if (!date) return 'TBA'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function calcDaysLeft(date: Date | null): number {
  if (!date) return 0
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {}, // subscribe — no-op
    () => true, // client snapshot
    () => false // server snapshot
  )
}

function useDaysLeft(deadline: Date | string) {
  const isClient = useIsClient()

  const deadlineDate = useMemo(() => parseDeadline(deadline), [deadline])
  const daysLeft = useMemo(() => calcDaysLeft(deadlineDate), [deadlineDate])
  const formattedDate = useMemo(
    () => formatDeadline(deadlineDate),
    [deadlineDate]
  )

  return { isClient, daysLeft, formattedDate }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OngoingEventCardProps {
  event: EventProps
}

export function OngoingEventCard({ event }: OngoingEventCardProps) {
  const { isClient, daysLeft, formattedDate } = useDaysLeft(event.deadline)
  const isUrgent =
    isClient && daysLeft > 0 && daysLeft <= URGENCY_THRESHOLD_DAYS

  return (
    <Card className="group border-border dark:hover:shadow-primary/5 flex w-full h-full flex-col overflow-hidden rounded-xl border pt-0 transition-all duration-300 hover:shadow-xl">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden">
        <CldImage
          src={event.image}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
          crop="fill"
          gravity="auto"
          format="auto"
          quality="auto"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {event.isFeatured && (
            <Badge className="border-none bg-amber-500 font-medium text-white shadow-sm backdrop-blur-md hover:bg-amber-600">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="bg-background/80 text-foreground w-fit text-[10px] font-semibold tracking-wider uppercase shadow-sm backdrop-blur-md"
          >
            {event.type.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <CardHeader className="px-5 py-0">
        <CardTitle className="line-clamp-2 text-xl leading-tight font-bold">
          {event.title}
        </CardTitle>
      </CardHeader>

      {/* Meta */}
      <CardContent className="flex-1 space-y-1 px-5">
        <div className="text-muted-foreground flex flex-col gap-2.5 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-primary h-4 w-4" />
            <span>
              Deadline: <span className="text-foreground">{formattedDate}</span>
            </span>
            {isUrgent && (
              <Badge variant="destructive" className="ml-auto h-5 text-[10px]">
                Ends in {daysLeft}d
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-primary h-4 w-4" />
              <span>
                <span className="text-foreground">
                  {event.TotalApplicants}+
                </span>{' '}
                Applied
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="text-primary h-4 w-4" />
              {event.isPaid ? (
                <span className="text-foreground font-semibold">
                  ৳{event.fee}
                </span>
              ) : (
                <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* CTA */}
      <CardFooter className="p-5 pt-0">
        {/* <Button className="group/btn w-full font-semibold">
          Register Now
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button> */}

        <RegisterButton event={event} />
      </CardFooter>
    </Card>
  )
}
