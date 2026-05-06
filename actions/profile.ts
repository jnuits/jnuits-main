'use server'

import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'

import { v2 as cloudinary } from 'cloudinary'

import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prismadb'

export async function resendVerificationEmail(): Promise<{
  success?: boolean
  error?: string
} | void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return { error: 'You must be signed in.' }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  })

  if (!dbUser) return { error: 'User not found.' }
  if (dbUser.emailVerified) return { error: 'Email is already verified.' }
  if (!dbUser.email) return { error: 'No email associated with your account.' }

  const email = dbUser.email

  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: '/profile' },
      headers: await headers(),
    })
    revalidateTag('profile', 'default')
    revalidateTag(`user-${session.user.id}`, 'default')
    return { success: true }
  } catch {
    return { error: 'Failed to send verification email.' }
  }
}

export type UpdateProfileState = {
  success?: boolean
  error?: string
}

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return { error: 'You must be signed in to update your profile.' }
  }

  const userId = session.user.id

  const name = formData.get('name')?.toString()?.trim()
  const phoneNumber = formData.get('phoneNumber')?.toString()?.trim() ?? ''
  const showPhone = formData.get('showPhone') === 'on'
  const showEmail = formData.get('showEmail') === 'on'

  if (!phoneNumber.trim() || phoneNumber.length < 10) {
    return { error: 'Please enter a valid phone number.' }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name || null }),
        phoneNumber,
        showPhone,
        showEmail,
      },
    })

    revalidateTag('profile', 'default')
    revalidateTag(`user-${userId}`, 'default')

    return { success: true }
  } catch {
    return { error: 'Failed to update profile. Please try again.' }
  }
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getPublicIdFromUrl(url: string) {
  try {
    const parts = url.split('/')
    const uploadIndex = parts.findIndex((part) => part === 'upload')
    if (uploadIndex === -1) return null
    return parts
      .slice(uploadIndex + 2)
      .join('/')
      .split('.')[0]
  } catch (error) {
    return null
  }
}

export async function processAvatarUpload(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      throw new Error('File or User ID missing!')
    }

    // 1. Check korbe URL asoley ache naki (Database theke)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })
    const oldImageUrl = currentUser?.image

    // 2. Jodi URL thake, tahole AGER TA AAGE DELETE korbe
    if (oldImageUrl) {
      const publicId = getPublicIdFromUrl(oldImageUrl)
      if (publicId) {
        await cloudinary.uploader.destroy(publicId)
        console.log(`Deleted old image: ${publicId}`)
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const newImageUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'JnUit_user_avatars' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result?.secure_url as string)
        }
      )
      uploadStream.end(buffer)
    })

    // 4. Database a notun URL update

    await prisma.user.update({
      where: { id: userId },
      data: { image: newImageUrl },
    })

    return { success: true, newImageUrl }
  } catch (error) {
    console.error('Upload process error:', error)
    return { success: false, error: 'Unable to update profile picture.' }
  }
}

// Member verification fc

export async function verifyMember(id: string) {
  const member = await prisma.user.findFirst({
    where: { membershipId: id },
    select: { name: true, membershipId: true, createdAt: true },
  })
  return member
}
