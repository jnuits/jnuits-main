import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { AuthProvider } from '@/components/features/AuthProvider'
import { ThemeProvider } from '@/components/features/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const figtree = Figtree({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://jnuits.org.bd"),
  title: 'JnU it Society - smart portal',
  description:
    "Welcome to the official Smart Portal of the Jagannath University IT Society (JnUITS). Complete your registration today to join a premier community of tech enthusiasts and innovators.",

  keywords: [
    "JnUIts",
    "jnuits",
    "JNU IT Society",
    "Jagannath University IT Society",
    "JnUITS membership",
    "JNU student organization",
    "IT society Bangladesh",
  ],

  icons: {
    icon: "/MainLogo.svg",
  },

  openGraph: {
    title: 'JnU it Society - smart portal',
    description:
      "Join the Jagannath University IT Society (JnUITS) through our official Smart Portal. Register now to connect, learn, and grow with fellow tech professionals.",
    url: "https://jnuits.org.bd/",
    siteName: "JnU ITS",
    images: [
      {
        url: "https://res.cloudinary.com/dp4fgwjik/image/upload/v1776816318/WhatsApp_Image_2026-04-22_at_6.02.24_AM_hnszse.jpg",
        width: 1200,
        height: 630,
        alt: "JnU ITS Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: 'JnU it Society - smart portal',
    description:
      "Join the Jagannath University IT Society (JnUITS) through our official Smart Portal. Register now to connect, learn, and grow with fellow tech professionals.",
    images: [
      "https://res.cloudinary.com/dp4fgwjik/image/upload/v1776816318/WhatsApp_Image_2026-04-22_at_6.02.24_AM_hnszse.jpg",
    ],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <main className="min-h-screen">{children}</main>
          </AuthProvider>
          <Toaster
            position="top-right"
            richColors
            icons={{
              success: <CircleCheckIcon className="size-4" />,
              info: <InfoIcon className="size-4" />,
              warning: <TriangleAlertIcon className="size-4" />,
              error: <OctagonXIcon className="size-4" />,
              loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
              {
                '--normal-bg': 'var(--popover)',
                '--normal-text': 'var(--popover-foreground)',
                '--normal-border': 'var(--border)',
                '--border-radius': 'var(--radius)',
              } as React.CSSProperties
            }
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
