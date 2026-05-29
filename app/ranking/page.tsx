"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { RotateCcw, Trophy, User, ChevronLeft, Coins } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string | null
  image: string | null
  totalPoints: number
  exactGuesses: number
  correctWinners: number
  totalGuesses: number
}

interface LeaderboardData {
  matches: { id: string; label: string; score: string }[]
  leaderboard: LeaderboardEntry[]
}

interface PoolEntry {
  rank: number
  userId: string
  name: string | null
  image: string | null
  balance: number
  lifetimeEarnings: number
  bets: number
  totalWagered: number
}

interface PoolLeaderboardData {
  leaderboard: PoolEntry[]
  totalPlayers: number
}

export default function RankingPage() {
  const { data: session } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [poolLeaderboard, setPoolLeaderboard] = useState<PoolLeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"guesses" | "pool">("guesses")

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/matches/leaderboard")
      const data = await res.json()
      setLeaderboard(data)
    } catch (e) {
      console.error("Failed to fetch leaderboard", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPoolLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pool/leaderboard")
      const data = await res.json()
      setPoolLeaderboard(data)
    } catch (e) {
      console.error("Failed to fetch pool leaderboard", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (tab === "guesses") fetchLeaderboard()
    else fetchPoolLeaderboard()
  }, [tab, fetchLeaderboard, fetchPoolLeaderboard])

  useEffect(() => {
    refresh()
  }, [tab, refresh])

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/timeline/live" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            <ChevronLeft className="h-3 w-3" /> Back to Live Results
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">
            <span className="text-yellow-400">User</span> Rankings
          </h1>
          <p className="text-sm text-muted-foreground">
            {tab === "guesses"
              ? "Full leaderboard — both exact = 5pts, one team exact = 2pts."
              : "Confidence Pool — ranked by lifetime chip earnings."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="border-white/10">
          <RotateCcw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1 border border-white/10 mb-8 w-fit">
        <button
          onClick={() => setTab("guesses")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
            tab === "guesses" ? "bg-zinc-800 text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          <Trophy className="h-3 w-3 inline mr-1.5" />
          Predictions
        </button>
        <button
          onClick={() => setTab("pool")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
            tab === "pool" ? "bg-zinc-800 text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          <Coins className="h-3 w-3 inline mr-1.5" />
          Confidence Pool
        </button>
      </div>

      {tab === "guesses" && (
        <>
          {leaderboard && leaderboard.matches.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {leaderboard.matches.map((m) => (
                <Badge key={m.id} className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                  {m.label}: {m.score}
                </Badge>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 border-2 border-white/20 border-t-yellow-400 animate-spin rounded-full" />
            </div>
          ) : leaderboard && leaderboard.leaderboard.length > 0 ? (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 w-16">Rank</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">User</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Points</th>
                    <th className="text-center px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Both</th>
                    <th className="text-center px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">One</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Guesses</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.leaderboard.map((entry) => {
                    const isMe = session?.user?.id === entry.userId
                    const avg = entry.totalGuesses > 0 ? (entry.totalPoints / entry.totalGuesses).toFixed(1) : "-"
                    return (
                      <tr key={entry.userId} className={cn(
                        "border-b border-white/5 last:border-0 transition-colors",
                        isMe ? "bg-yellow-500/5 hover:bg-yellow-500/10" : "hover:bg-white/5"
                      )}>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={cn(
                            "font-bold text-sm",
                            entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-zinc-300" : entry.rank === 3 ? "text-amber-600" : "text-white/30"
                          )}>
                            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.image ?? undefined} />
                              <AvatarFallback className="text-xs bg-zinc-800">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className={cn("font-semibold", isMe ? "text-yellow-400" : "text-white/80")}>
                                {entry.name ?? "Anonymous"}
                              </span>
                              {isMe && <span className="text-[10px] text-yellow-400/60 ml-2">(you)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="font-black text-lg text-yellow-400">{entry.totalPoints}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center text-green-400 font-bold hidden sm:table-cell">{entry.exactGuesses}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-blue-400 font-bold hidden sm:table-cell">{entry.correctWinners}</td>
                        <td className="px-4 sm:px-6 py-4 text-right text-white/40 hidden sm:table-cell">{entry.totalGuesses}</td>
                        <td className="px-4 sm:px-6 py-4 text-right text-white/40 hidden md:table-cell">{avg}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-24 text-white/30">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-bold mb-2">No rankings yet</h2>
              <p className="text-sm max-w-md mx-auto">
                Submit your predictions on the Live Results page. Once matches are confirmed as fact, your scores will appear here.
              </p>
              <Link href="/timeline/live">
                <Button className="mt-6 bg-yellow-600 hover:bg-yellow-500">
                  Go to Live Results
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {tab === "pool" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 border-2 border-white/20 border-t-yellow-400 animate-spin rounded-full" />
            </div>
          ) : poolLeaderboard && poolLeaderboard.leaderboard.length > 0 ? (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 w-16">Rank</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">User</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Earnings</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Balance</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Bets</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Wagered</th>
                  </tr>
                </thead>
                <tbody>
                  {poolLeaderboard.leaderboard.map((entry) => {
                    const isMe = session?.user?.id === entry.userId
                    return (
                      <tr key={entry.userId} className={cn(
                        "border-b border-white/5 last:border-0 transition-colors",
                        isMe ? "bg-yellow-500/5 hover:bg-yellow-500/10" : "hover:bg-white/5"
                      )}>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={cn(
                            "font-bold text-sm",
                            entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-zinc-300" : entry.rank === 3 ? "text-amber-600" : "text-white/30"
                          )}>
                            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.image ?? undefined} />
                              <AvatarFallback className="text-xs bg-zinc-800">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className={cn("font-semibold", isMe ? "text-yellow-400" : "text-white/80")}>
                                {entry.name ?? "Anonymous"}
                              </span>
                              {isMe && <span className="text-[10px] text-yellow-400/60 ml-2">(you)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="font-black text-lg text-yellow-400">
                            <Coins className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                            {entry.lifetimeEarnings.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-white/60 font-bold hidden sm:table-cell tabular-nums">
                          {entry.balance.toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-white/40 hidden sm:table-cell">{entry.bets}</td>
                        <td className="px-4 sm:px-6 py-4 text-right text-white/40 hidden md:table-cell tabular-nums">
                          {entry.totalWagered.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-24 text-white/30">
              <Coins className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-bold mb-2">No pool action yet</h2>
              <p className="text-sm max-w-md mx-auto">
                Head to the Pool page to place your first bets. Once matches are resolved, rankings appear here.
              </p>
              <Link href="/pool">
                <Button className="mt-6 bg-yellow-600 hover:bg-yellow-500">
                  Go to Confidence Pool
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
