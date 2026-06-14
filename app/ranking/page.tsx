"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { RotateCcw, User, ChevronLeft, Award, ShieldCheck, Save } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface OverallEntry {
  rank: number
  userId: string
  name: string | null
  image: string | null
  overallScore: number
  adjustment: number
  connection: { bestScore: number; skill: number; gamesPlayed: number }
  prediction: { totalPoints: number; skill: number; totalGuesses: number }
  pool: { totalPayout: number; skill: number; totalBets: number }
  games: { bestScore: number; skill: number; totalGames: number }
  chips: { lifetimeEarnings: number; skill: number }
}

interface OverallLeaderboardData {
  leaderboard: OverallEntry[]
  totalPlayers: number
}

interface AdminUser {
  id: string
  name: string | null
  email: string
  adjustment: number
}

export default function RankingPage() {
  const { data: session } = useSession()
  const [overallLeaderboard, setOverallLeaderboard] = useState<OverallLeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [editAdjustments, setEditAdjustments] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const isAdmin = session?.user?.email?.toLowerCase() === "sebacontegrand@gmail.com"

  const fetchOverallLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ranking/overall")
      const data = await res.json()
      setOverallLeaderboard(data)
    } catch (e) {
      console.error("Failed to fetch overall leaderboard", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAdminUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ranking/adjust")
      if (!res.ok) return
      const data = await res.json()
      setAdminUsers(data)
      const edits: Record<string, string> = {}
      for (const u of data) {
        edits[u.id] = u.adjustment.toString()
      }
      setEditAdjustments(edits)
    } catch (e) {
      console.error("Failed to fetch admin users", e)
    }
  }, [])

  const handleSaveAdjustment = useCallback(async (userId: string) => {
    const val = parseInt(editAdjustments[userId])
    if (isNaN(val)) return
    setSaving(userId)
    try {
      const res = await fetch("/api/admin/ranking/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adjustment: val }),
      })
      if (res.ok) {
        toast.success("Adjustment saved!")
        await fetchOverallLeaderboard()
        await fetchAdminUsers()
      } else {
        toast.error("Failed to save adjustment")
      }
    } catch {
      toast.error("Failed to connect")
    } finally {
      setSaving(null)
    }
  }, [editAdjustments, fetchOverallLeaderboard, fetchAdminUsers])

  useEffect(() => {
    fetchOverallLeaderboard()
  }, [fetchOverallLeaderboard])

  useEffect(() => {
    if (showAdmin && isAdmin) {
      fetchAdminUsers()
    }
  }, [showAdmin, isAdmin, fetchAdminUsers])

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/timeline/live" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Back to Live Results
            </Link>
            {isAdmin && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-all",
                  showAdmin
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "text-white/30 border-white/10 hover:text-white/60"
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                Admin
              </button>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">
            <span className="text-yellow-400">Overall</span> Rankings
          </h1>
          <p className="text-sm text-muted-foreground">
            Weighted composite — Connections ×20%, Predictions ×25%, Pool ×30%, Games ×15%, Chips ×10%.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOverallLeaderboard} disabled={loading} className="border-white/10">
          <RotateCcw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 border-2 border-white/20 border-t-yellow-400 animate-spin rounded-full" />
        </div>
      ) : overallLeaderboard && overallLeaderboard.leaderboard.length > 0 ? (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 w-16">Rank</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">User</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Overall</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Conn.</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Pred.</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Pool</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Games</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Chips</th>
                  {showAdmin && <th className="text-right px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Adj.</th>}
                </tr>
              </thead>
              <tbody>
                {overallLeaderboard.leaderboard.map((entry) => {
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
                        <span className="font-black text-lg text-yellow-400">{entry.overallScore.toFixed(1)}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-white/60 font-bold hidden sm:table-cell tabular-nums">
                        {entry.connection.skill.toFixed(0)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-white/60 font-bold hidden sm:table-cell tabular-nums">
                        {entry.prediction.skill.toFixed(0)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-white/60 font-bold hidden md:table-cell tabular-nums">
                        {entry.pool.skill.toFixed(0)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-white/60 font-bold hidden md:table-cell tabular-nums">
                        {entry.games.skill.toFixed(0)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-cyan-400 font-bold hidden md:table-cell tabular-nums">
                        {entry.chips.skill.toFixed(0)}
                      </td>
                      {showAdmin && (
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className={cn(
                            "text-xs font-bold font-mono",
                            entry.adjustment > 0 ? "text-green-400" : entry.adjustment < 0 ? "text-red-400" : "text-white/30"
                          )}>
                            {entry.adjustment > 0 ? "+" : ""}{entry.adjustment}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {showAdmin && isAdmin && (
            <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 bg-red-500/10 border-b border-red-500/20">
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin — Ranking Adjustments
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40">User</th>
                      <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Email</th>
                      <th className="text-right px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Adjustment</th>
                      <th className="text-right px-3 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-2 text-xs text-white/70">{u.name ?? "Anonymous"}</td>
                        <td className="px-3 py-2 text-[10px] text-white/40 font-mono">{u.email}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            value={editAdjustments[u.id] ?? "0"}
                            onChange={(e) => setEditAdjustments(prev => ({ ...prev, [u.id]: e.target.value }))}
                            className="w-20 h-7 text-right text-xs font-mono bg-zinc-900 border-white/10 ml-auto"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSaveAdjustment(u.id)}
                            disabled={saving === u.id}
                            className="h-7 text-[10px] bg-red-600 hover:bg-red-500"
                          >
                            {saving === u.id ? (
                              <div className="h-3 w-3 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24 text-white/30">
          <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">No rankings yet</h2>
          <p className="text-sm max-w-md mx-auto">
            Play Connections, Trivia, Sort games, submit predictions, and bet in the Confidence Pool to build your overall score.
          </p>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Link href="/connection">
              <Button variant="outline" className="border-white/10">Play Connections</Button>
            </Link>
            <Link href="/games">
              <Button variant="outline" className="border-white/10">Play Games</Button>
            </Link>
            <Link href="/timeline/live">
              <Button variant="outline" className="border-white/10">Make Predictions</Button>
            </Link>
            <Link href="/pool">
              <Button className="bg-yellow-600 hover:bg-yellow-500">Confidence Pool</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
