"use client"

import { useEffect, useState } from "react"
import { Sparkles, Trophy } from "lucide-react"

interface MatchItem {
  teamA: string | null
  teamB: string | null
  scoreA: number
  scoreB: number
}

interface BannerData {
  summary: string | null
  date: string
  matchCount: number
  generatedAt: string
  matches: MatchItem[]
}

export function DailyBanner() {
  const [data, setData] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch("/api/daily-banner")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const dateLabel = data?.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : ""

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="h-4 w-3/4 rounded bg-white/10 mx-auto mb-3" />
        <div className="flex justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 rounded bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.matchCount === 0) {
    return null
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-500/40 via-fuchsia-500/40 to-cyan-500/40 opacity-80 blur-sm group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-cyan-500/20 animate-pulse" />

      <div className="relative rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-fuchsia-500/10">
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-3">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>
            <span className="text-amber-400">{dateLabel}</span>
            <span className="mx-1.5 text-white/20">&middot;</span>
            {data.matchCount} match{data.matchCount !== 1 ? "es" : ""}
          </span>
          <Trophy className="h-3 w-3 text-cyan-400" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {data.matches.map((m, i) => {
            const winner = m.scoreA > m.scoreB ? "A" : m.scoreB > m.scoreA ? "B" : null
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <span className={`text-xs font-bold ${winner === "A" ? "text-emerald-400" : "text-white/60"}`}>
                  {m.teamA}
                </span>
                <span className="font-black font-mono text-sm text-white tabular-nums">
                  {m.scoreA}-{m.scoreB}
                </span>
                <span className={`text-xs font-bold ${winner === "B" ? "text-emerald-400" : "text-white/60"}`}>
                  {m.teamB}
                </span>
              </div>
            )
          })}
        </div>

        {data.summary && (
          <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed text-center italic border-t border-white/5 pt-3">
            {data.summary}
          </p>
        )}


      </div>
    </div>
  )
}
