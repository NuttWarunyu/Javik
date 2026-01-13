import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Javik - สร้างคลิปอัตโนมัติ',
  description: 'Javik - สร้างคลิป TikTok/YouTube Shorts อัตโนมัติด้วย AI - เพียงพิมพ์หัวข้อ AI จะสร้างวิดีโอให้คุณ',
  keywords: ['Javik', 'TikTok', 'YouTube Shorts', 'AI', 'Video Creation', 'Automation'],
  authors: [{ name: 'Javik' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#0284c7',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Javik',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="scroll-smooth">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'} />
      </head>
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  )
}

