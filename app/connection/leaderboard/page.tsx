"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Trophy, Medal, User, Gamepad2, RotateCcw, ChevronLeft } from "lucide-react"
import Link from "next/link"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string | null
  image: string | null
  totalScore: number
  gamesPlayed: number
  bestScore: number
  fastestTime: number
  avgChainLength: number
}

export default function ConnectionLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/connection/leaderboard")
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/connection"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white mb-4"
        >
          <ChevronLeft className="h-3 w-3" /> Back to Connection
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Connection <span className="text-yellow-400">Leaderboard</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Top players ranked by total connection puzzle score.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            className="border-white/10 text-[10px] h-7"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="h-12 w-12 text-yellow-500/30 mb-3" />
          <p className="text-sm font-bold text-white/50">No scores yet</p>
          <p className="text-xs text-white/30 mt-1">Play a game to appear on the leaderboard.</p>
          <Link href="/connection/play?difficulty=easy&mode=infinite">
            <Button size="sm" className="mt-4 text-xs">
              Play Now
            </Button>
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 overflow-hidden"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 w-10">Rank</th>
                <th className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40">Player</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40">Score</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Games</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Best</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Avg Chain</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.userId} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "font-bold",
                      entry.rank === 1 ? "text-yellow-400" :
                      entry.rank === 2 ? "text-zinc-300" :
                      entry.rank === 3 ? "text-amber-600" : "text-white/30"
                    )}>
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {entry.image ? (
                        <img src={entry.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="h-3 w-3 text-white/30" />
                        </div>
                      )}
                      <span className="font-medium text-white/80 truncate max-w-[120px]">{entry.name ?? "Anonymous"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-primary tabular-nums">{entry.totalScore}</td>
                  <td className="px-3 py-2.5 text-center text-white/40 tabular-nums hidden sm:table-cell">{entry.gamesPlayed}</td>
                  <td className="px-3 py-2.5 text-center text-white/60 tabular-nums hidden sm:table-cell">{entry.bestScore}</td>
                  <td className="px-3 py-2.5 text-center text-white/40 tabular-nums hidden sm:table-cell">{entry.avgChainLength.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
