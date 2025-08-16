import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { ClientSessionProvider } from "@/components/session-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FarmMarket - Uganda's Farmer Market Platform",
  description: "Real-time market prices, weather updates, and direct trading for Ugandan farmers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <Navigation />
            {children}
            <Toaster />
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  )
}
