import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prismadb'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const user = await prisma.myuser.create({
      data: {
        name: body.name,
        email: body.email,
      },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    )
  }
}
