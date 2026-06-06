"use client"

import { useState, useEffect } from "react"

const TOURNAMENT_START = new Date("2026-06-11T00:00:00Z").getTime()

function calcTimeLeft() {
  const now = Date.now()
  const diff = Math.max(0, TOURNAMENT_START - now)
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function TournamentCountdown() {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTimeLeft(calcTimeLeft), 1000)
    return () => clearInterval(timer)
  }, [])

  // Render placeholder matching structure during SSR to prevent layout shift
  if (!mounted) {
    return (
      <div className="flex items-center gap-4 sm:gap-6">
        {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white/10">00</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/10">{unit}</span>
          </div>
        ))}
      </div>
    )
  }

  const isStarted = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  if (isStarted) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-lg font-black uppercase tracking-wider text-primary animate-pulse-neon">
          Tournament Underway
        </span>
      </div>
    )
  }

  const units = [
    { key: "days", value: timeLeft.days, label: "Days" },
    { key: "hours", value: timeLeft.hours, label: "Hours" },
    { key: "minutes", value: timeLeft.minutes, label: "Minutes" },
    { key: "seconds", value: timeLeft.seconds, label: "Seconds" },
  ] as const

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {units.map((unit) => (
        <div key={unit.key} className="flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-semibold">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}
