'use server'

import {
  cacheLife,
  cacheTag,
  revalidatePath,
  revalidateTag,
  updateTag,
} from 'next/cache'
import { connection } from 'next/server'
import { Prisma, RegistrationType } from '@prisma/client'

import { verifyAdminAccess } from '@/lib/VerifyAdmin'
import { prisma } from '@/lib/prismadb'

import { deleteImageAction } from '../cloudinary'

export interface GetEventsParams {
  page?: number
  limit?: number
  search?: string
  type?: RegistrationType | 'ALL'
  isActive?: 'true' | 'false' | 'ALL'
}

type RegistrationMetadata = {
  screenshotUrl?: string | null
  gender?: string | null
  facebook?: string | null
  basicSkills?: string | null
  coupon?: string | null
  discountApplied?: number | null
}
// ─── Get All Events ───────────────────────────────────────────────────────────
export async function getAdminPaginatedEvents(params: GetEventsParams) {
  await verifyAdminAccess()

  const page = params.page || 1
  const limit = params.limit || 10
  const skip = (page - 1) * limit

  // Using strict Prisma types instead of 'any'
  const whereClause: Prisma.EventWhereInput = {}

  if (params.search) {
    whereClause.title = { contains: params.search, mode: 'insensitive' }
  }
  if (params.type && params.type !== 'ALL') {
    whereClause.type = params.type
  }
  if (params.isActive && params.isActive !== 'ALL') {
    whereClause.isActive = params.isActive === 'true'
  }

  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        orderBy: { deadline: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { registrations: true, guestRegistrations: true },
          },
        },
      }),
      prisma.event.count({ where: whereClause }),
    ])

    return {
      success: true,
      events,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page },
    }
  } catch (error) {
    console.error('[getAdminPaginatedEvents]', error)
    return {
      success: false,
      error: 'Failed to fetch events.',
      events: [],
      pagination: null,
    }
  }
}

// ─── Get Event Registrations ──────────────────────────────────────────────────
export async function getEventRegistrations(eventId: string) {
  await verifyAdminAccess()
  try {
    const [members, guests] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              studentId: true,
              phoneNumber: true,
            },
          },
          payments: {
            select: {
              amount: true,
              transactionId: true,
              provider: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.guestRegistration.findMany({
        where: { eventId },
        include: {
          payments: {
            select: {
              amount: true,
              transactionId: true,
              provider: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      }),
    ])
    return { success: true, members, guests }
  } catch (error) {
    console.error('[getEventRegistrations]', error)
    return { success: false, error: 'Failed to fetch registrations.' }
  }
}

// ─── Toggle Event Status ──────────────────────────────────────────────────────
export async function toggleEventStatus(id: string) {
  await verifyAdminAccess()

  try {
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return { success: false, error: 'Event not found.' }

    await prisma.event.update({
      where: { id },
      data: { isActive: !event.isActive },
    })
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error) {
    console.error('[toggleEventStatus]', error)
    return { success: false, error: 'Failed to update event.' }
  }
}

// ─── Edit Event ───────────────────────────────────────────────────────────────
export async function updateEvent(
  id: string,
  data: {
    title?: string
    fee?: number
    isPaid?: boolean
    deadline?: string
    isActive?: boolean
    isFeatured?: boolean
    isPublic?: boolean
  }
) {
  await verifyAdminAccess()

  try {
    await prisma.event.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    })
    updateTag('all-events')
    revalidatePath('/dashboard/events_management')
    return { success: true }
  } catch (error) {
    console.error('[updateEvent]', error)
    return { success: false, error: 'Failed to update event.' }
  }
}

export async function archiveEvent(id: string) {
  await verifyAdminAccess()

  try {
    // Step 1: Count total participants
    const [memberCount, guestCount] = await Promise.all([
      prisma.registration.count({ where: { eventId: id } }),
      prisma.guestRegistration.count({ where: { eventId: id } }),
    ])

    const totalApplicants = memberCount + guestCount

    // Step 2: Extract registration IDs
    // const memberRegs = await prisma.registration.findMany({
    //   where: { eventId: id },
    //   select: { id: true, metadata: true},
    // })

    // const guestRegs = await prisma.guestRegistration.findMany({
    //   where: { eventId: id },
    //   select: { id: true, metadata: true },
    // })

    const [memberRegs, guestRegs] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId: id },
        select: { id: true, metadata: true },
      }),
      prisma.guestRegistration.findMany({
        where: { eventId: id },
        select: { id: true, metadata: true },
      }),
    ])

    const memberRegIds = memberRegs.map((r) => r.id)
    const guestRegIds = guestRegs.map((r) => r.id)

    const imageUrlsToDelete: string[] = []

    // Member দের metadata থেকে screenshotUrl বের করা
    memberRegs.forEach((reg) => {
      const meta = reg.metadata as RegistrationMetadata | null
      if (meta?.screenshotUrl) {
        imageUrlsToDelete.push(meta.screenshotUrl)
      }
    })

    // Guest দের metadata থেকে screenshotUrl বের করা
    guestRegs.forEach((reg) => {
      const meta = reg.metadata as RegistrationMetadata | null
      if (meta?.screenshotUrl) {
        imageUrlsToDelete.push(meta.screenshotUrl)
      }
    })

    // Step 3: Transaction
    await prisma.$transaction([
      // delete payments first
      prisma.payment.deleteMany({
        where: { registrationId: { in: memberRegIds } },
      }),
      prisma.guestPayment.deleteMany({
        where: { guestRegistrationId: { in: guestRegIds } },
      }),

      // delete registrations
      prisma.registration.deleteMany({ where: { eventId: id } }),
      prisma.guestRegistration.deleteMany({ where: { eventId: id } }),

      // update event as archived
      prisma.event.update({
        where: { id },
        data: {
          isFeatured: true,
          isActive: false,
          totalApplicants,
        },
      }),
    ])

    // Step 4: Delete images from Cloudinary (DB ট্রানজেকশন সফল হওয়ার পর)
    if (imageUrlsToDelete.length > 0) {
      await Promise.allSettled(
        imageUrlsToDelete.map((url) => deleteImageAction(url))
      )
      console.log(
        `[archiveEvent] Deleted ${imageUrlsToDelete.length} images from Cloudinary.`
      )
    }

    updateTag('all-events')
    revalidateTag('registrations', 'max')
    return { success: true, totalApplicants }
  } catch (error) {
    console.error('[archiveEvent]', error)
    return { success: false, error: 'Failed to archive event.' }
  }
}

// ─── Delete All Registrations Only ────────────────────────────────────────────
export async function deleteAllRegistrations(eventId: string) {
  await verifyAdminAccess()

  try {
    const memberRegs = await prisma.registration.findMany({
      where: { eventId },
      select: { id: true },
    })
    const memberRegIds = memberRegs.map((r) => r.id)

    const guestRegs = await prisma.guestRegistration.findMany({
      where: { eventId },
      select: { id: true },
    })
    const guestRegIds = guestRegs.map((r) => r.id)

    await prisma.$transaction([
      prisma.payment.deleteMany({
        where: { registrationId: { in: memberRegIds } },
      }),
      prisma.guestPayment.deleteMany({
        where: { guestRegistrationId: { in: guestRegIds } },
      }),
      prisma.registration.deleteMany({ where: { eventId } }),
      prisma.guestRegistration.deleteMany({ where: { eventId } }),
    ])

    updateTag('all-events')
    return { success: true }
  } catch (error) {
    console.error('[deleteAllRegistrations]', error)
    return { success: false, error: 'Failed to delete all registrations.' }
  }
}

// ─── Update Payment Status ────────────────────────────────────────────────────
export async function updatePaymentStatus(
  paymentId: string,
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
  isGuest = false
) {
  await verifyAdminAccess()

  try {
    if (isGuest) {
      await prisma.guestPayment.update({
        where: { id: paymentId },
        data: { status },
      })
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[updatePaymentStatus]', error)
    return { success: false, error: 'Failed to update payment.' }
  }
}

// ─── Update Registration Status ───────────────────────────────────────────────
export async function updateRegistrationStatus(
  registrationId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  isGuest = false
) {
  await verifyAdminAccess()

  try {
    if (isGuest) {
      await prisma.guestRegistration.update({
        where: { id: registrationId },
        data: { status },
      })

      updateTag(`registrations`)
    } else {
      const registration = await prisma.registration.update({
        where: { id: registrationId },
        data: { status },
        select: { userId: true },
      })

      updateTag(`user-registrations-${registration.userId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[updateRegistrationStatus]', error)
    return { success: false, error: 'Failed to update registration.' }
  }
}



// ─── Get Only Ongoing (Active) Events ────────────────────────────────────────


export async function getOngoingEvents() {
  await connection();

  try {
    const ongoingEvents = await prisma.event.findMany({
      where: {
        isActive: true,
        deadline: {
          gte: new Date(),
        },
      },
      include: {
        _count: {
          select: {
            registrations: true,
            guestRegistrations: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    const eventsWithApplicantCount = ongoingEvents.map((event) => {
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        TotalApplicants: _count.registrations + _count.guestRegistrations,
      };
    });

    return {
      success: true,
      events: eventsWithApplicantCount,
    };
  } catch (error) {
    console.error('[getOngoingEvents]', error);
    return {
      success: false,
      error: 'Failed to fetch ongoing events.',
      events: [],
    };
  }
}