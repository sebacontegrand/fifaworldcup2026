import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NavBar } from "@/components/nav-bar"
import { SimulationProvider } from "@/lib/hooks/use-simulation"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 Predictor",
  description:
    "Predict World Cup 2026 outcomes using Elo ratings, Monte Carlo simulation, and game theory. Explore teams, groups, brackets, and player rankings.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-grid">
        <SimulationProvider>
          <NavBar />
          <main>{children}</main>
          <Analytics />
        </SimulationProvider>
      </body>
    </html>
  )
}
