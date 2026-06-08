"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import type { GroupStanding } from "@/lib/simulation"
import { getScheduleByDay, getMatchKickoff, isMatchLocked, getCountdown, type ScheduleMatch } from "@/lib/schedule"
import { getFlagImageUrl } from "@/lib/team-flags"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Activity, RotateCcw, Play, CheckCircle2, ChevronRight, Trophy, Save, User, Lock, Share2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MatchDTO {
  id: string
  round: string
  groupId: string | null
  matchOrder: number
  teamAId: string | null
  teamBId: string | null
  teamAName: string | null
  teamBName: string | null
  scoreA: number | null
  scoreB: number | null
  isFact: boolean
  guess: { scoreA: number; scoreB: number } | null
}

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

function calcPoints(guessA: number, guessB: number, actualA: number, actualB: number): number {
  const aMatch = guessA === actualA
  const bMatch = guessB === actualB
  if (aMatch && bMatch) return 300
  if (aMatch || bMatch) return 100
  return 0
}

function computeGroupStandings(matches: MatchDTO[]): Record<string, GroupStanding[]> {
  const groups: Record<string, Map<string, GroupStanding>> = {}
  for (const m of matches) {
    if (!m.isFact || m.scoreA == null || m.scoreB == null || !m.teamAId || !m.teamBId) continue
    const g = m.groupId ?? "unknown"
    if (!groups[g]) groups[g] = new Map()
    const aId = m.teamAId, bId = m.teamBId
    const aScore = m.scoreA, bScore = m.scoreB
    if (!groups[g].has(aId)) groups[g].set(aId, { teamId: aId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })
    if (!groups[g].has(bId)) groups[g].set(bId, { teamId: bId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })
    const a = groups[g].get(aId)!, b = groups[g].get(bId)!
    a.played++; b.played++
    a.goalsFor += aScore; a.goalsAgainst += bScore
    b.goalsFor += bScore; b.goalsAgainst += aScore
    if (aScore > bScore) { a.won++; b.lost++; a.points += 3 }
    else if (aScore < bScore) { b.won++; a.lost++; b.points += 3 }
    else { a.drawn++; b.drawn++; a.points++; b.points++ }
    a.goalDifference = a.goalsFor - a.goalsAgainst
    b.goalDifference = b.goalsFor - b.goalsAgainst
  }
  const result: Record<string, GroupStanding[]> = {}
  for (const [g, map] of Object.entries(groups)) {
    result[g] = Array.from(map.values()).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
  }
  return result
}

function findMatchDTO(matches: MatchDTO[], teamAId: string | null, teamBId: string | null): MatchDTO | undefined {
  if (!teamAId || !teamBId) return undefined
  return matches.find(
    (m) =>
      (m.teamAId === teamAId && m.teamBId === teamBId) ||
      (m.teamAId === teamBId && m.teamBId === teamAId)
  )
}

const scheduleDays = getScheduleByDay()
const dayValues = scheduleDays.map((d) => d.date)
const defaultTab = dayValues[0] ?? "leaderboard"

export default function LiveResultsPage() {
  const { data: session } = useSession()
  const { tournamentState, updateMatchResult, simulate, isRunning, resetConfig, result } = useSimulation()

  const [matches, setMatches] = useState<MatchDTO[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [savingGuess, setSavingGuess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [renderTick, setRenderTick] = useState(0)
  const forceRender = useCallback(() => setRenderTick((t) => t + 1), [])
  const [now, setNow] = useState(Date.now())
  const guessInputs = useRef<Record<string, { scoreA: string; scoreB: string }>>({})
  const overrideInputs = useRef<Record<string, { scoreA: string; scoreB: string }>>({})

  const isAdmin = session?.user?.email?.toLowerCase() === "sebacontegrand@gmail.com"
  const [submittingAdminId, setSubmittingAdminId] = useState<string | null>(null)
  const [unlockedFacts, setUnlockedFacts] = useState<Record<string, boolean>>({})

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches")
      const data = await res.json()
      setMatches(data)
    } catch (e) {
      console.error("Failed to fetch matches", e)
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/leaderboard")
      const data = await res.json()
      setLeaderboard(data)
    } catch (e) {
      console.error("Failed to fetch leaderboard", e)
    }
  }, [])

  const handleAdminSubmitFact = useCallback(async (matchId: string, scoreA: number, scoreB: number) => {
    setSubmittingAdminId(matchId)
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA, scoreB }),
      })
      if (res.ok) {
        toast.success("Official result saved and prediction points recalculated!")
        setUnlockedFacts(prev => ({ ...prev, [matchId]: false }))
        await fetchMatches()
        await fetchLeaderboard()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save official result")
      }
    } catch (e) {
      toast.error("Failed to connect to server")
    } finally {
      setSubmittingAdminId(null)
    }
  }, [fetchMatches, fetchLeaderboard])

  const handleAdminDeleteFact = useCallback(async (matchId: string) => {
    if (!window.confirm("Delete this official result? All scores, guess points, and bet payouts for this match will be reset.")) return
    setSubmittingAdminId(matchId)
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      })
      if (res.ok) {
        toast.success("Official result deleted!")
        setUnlockedFacts(prev => ({ ...prev, [matchId]: false }))
        await fetchMatches()
        await fetchLeaderboard()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete official result")
      }
    } catch (e) {
      toast.error("Failed to connect to server")
    } finally {
      setSubmittingAdminId(null)
    }
  }, [fetchMatches, fetchLeaderboard])

  const handleUnlockFact = (teamAId: string, teamBId: string, matchDTO: MatchDTO) => {
    updateMatchResult(teamAId, teamBId, {
      scoreA: matchDTO.scoreA ?? 0,
      scoreB: matchDTO.scoreB ?? 0,
    } as any)
    setUnlockedFacts(prev => ({ ...prev, [matchDTO.id]: true }))
  }

  const handleCancelUnlock = (teamAId: string, teamBId: string, matchId: string) => {
    updateMatchResult(teamAId, teamBId, null)
    setUnlockedFacts(prev => ({ ...prev, [matchId]: false }))
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(timer)
  }, [])

  const factMatchesExist = matches.some((m) => m.isFact)
  const factStandings = computeGroupStandings(matches)

  useEffect(() => {
    fetchMatches()
    fetchLeaderboard()
  }, [fetchMatches, fetchLeaderboard])

  useEffect(() => {
    if (factMatchesExist) {
      setActiveTab("leaderboard")
    } else {
      setActiveTab(defaultTab)
    }
  }, [factMatchesExist])

  const chipReward = useRef<number>(0)

  const saveGuessToServer = useCallback(async (matchId: string, scoreA: number, scoreB: number) => {
    setSavingGuess(matchId)
    try {
      const res = await fetch(`/api/matches/${matchId}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA, scoreB }),
      })
      if (res.ok) {
        const reward = chipReward.current
        if (reward > 0) {
          fetch("/api/chips/earn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: reward, source: "live_guess" }),
          }).catch(() => {})
        }
        await fetchMatches()
        await fetchLeaderboard()
      }
    } catch (e) {
      console.error("Failed to save guess", e)
    } finally {
      setSavingGuess(null)
    }
  }, [fetchMatches, fetchLeaderboard])

  const handleScoreChange = (teamAId: string, teamBId: string, side: "A" | "B", value: string) => {
    const key = `${teamAId}_${teamBId}`
    if (!overrideInputs.current[key]) {
      const current = tournamentState.matchOverrides[key]
      overrideInputs.current[key] = {
        scoreA: current?.scoreA?.toString() ?? "",
        scoreB: current?.scoreB?.toString() ?? "",
      }
    }
    overrideInputs.current[key][side === "A" ? "scoreA" : "scoreB"] = value
    forceRender()
  }

  const handleScoreBlur = (teamAId: string, teamBId: string) => {
    const key = `${teamAId}_${teamBId}`
    const local = overrideInputs.current[key]
    if (!local) return
    const parsedA = parseInt(local.scoreA)
    const parsedB = parseInt(local.scoreB)
    if (isNaN(parsedA) || isNaN(parsedB)) return
    updateMatchResult(teamAId, teamBId, { scoreA: parsedA, scoreB: parsedB } as any)
  }

  const handleClearResult = (teamAId: string, teamBId: string) => {
    const key = `${teamAId}_${teamBId}`
    delete overrideInputs.current[key]
    updateMatchResult(teamAId, teamBId, null)
  }

  const handleGuessChange = (matchId: string, side: "A" | "B", value: string) => {
    if (!guessInputs.current[matchId]) {
      const match = matches.find((m) => m.id === matchId)
      guessInputs.current[matchId] = {
        scoreA: match?.guess?.scoreA?.toString() ?? "",
        scoreB: match?.guess?.scoreB?.toString() ?? "",
      }
    }
    guessInputs.current[matchId][side === "A" ? "scoreA" : "scoreB"] = value
  }

  const handleSubmitGuess = (matchId: string) => {
    const inputs = guessInputs.current[matchId]
    if (!inputs) return
    const parsedA = parseInt(inputs.scoreA)
    const parsedB = parseInt(inputs.scoreB)
    if (isNaN(parsedA) || isNaN(parsedB)) return
    chipReward.current = (parsedA === 1 && parsedB === 0) || (parsedA === 0 && parsedB === 1) ? 200 : 400
    setMatches(prev => prev.map(m =>
      m.id === matchId
        ? { ...m, guess: { scoreA: parsedA, scoreB: parsedB } }
        : m
    ))
    delete guessInputs.current[matchId]
    saveGuessToServer(matchId, parsedA, parsedB)
  }

  const handleQuickPick = (matchId: string, homeWins: boolean) => {
    if (!guessInputs.current[matchId]) {
      guessInputs.current[matchId] = { scoreA: "", scoreB: "" }
    }
    guessInputs.current[matchId].scoreA = homeWins ? "1" : "0"
    guessInputs.current[matchId].scoreB = homeWins ? "0" : "1"
    forceRender()
  }

  const renderMatchCard = (fixture: ScheduleMatch) => {
    const locked = isMatchLocked(fixture)
    const kickoff = getMatchKickoff(fixture)
    const countdown = getCountdown(kickoff)
    const overrideKey = fixture.homeTeamId && fixture.awayTeamId
      ? `${fixture.homeTeamId}_${fixture.awayTeamId}`
      : ""
    const override = overrideKey ? tournamentState.matchOverrides[overrideKey] : undefined
    const isSet = !!override
    const matchDTO = findMatchDTO(matches, fixture.homeTeamId, fixture.awayTeamId)
    const guess = matchDTO?.guess
    const guessKey = matchDTO?.id ?? fixture.matchNumber.toString()
    const gInputs = guessInputs.current[guessKey] ?? {
      scoreA: guess?.scoreA?.toString() ?? "",
      scoreB: guess?.scoreB?.toString() ?? "",
    }
    const hasGuess = !!guess

    return (
      <div key={fixture.matchNumber} className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all",
        locked ? "border-white/5 opacity-70" : "border-white/10"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/5 text-white/40 border-white/10 text-[8px] sm:text-[9px] px-1.5 py-0">
              {fixture.groupId}
            </Badge>
            {locked && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[8px] px-1.5 py-0 gap-0.5">
                <Lock className="h-2.5 w-2.5" /> Locked
              </Badge>
            )}
            {!locked && !matchDTO?.isFact && (
              <span className="text-[9px] text-yellow-400/60 font-mono tabular-nums">{countdown}</span>
            )}
          </div>
          <span className="text-[9px] text-white/30">{fixture.time}</span>
        </div>

        {/* Score Row */}
        <div className={cn("flex items-center justify-between px-3 py-2.5", isSet ? "bg-green-500/5" : "")}>
          <div className="flex items-center gap-2 w-[90px] sm:w-[130px]">
            {fixture.homeTeamId && <img src={getFlagImageUrl(fixture.homeTeamId, 28)} alt="" className="h-6 w-6 object-contain" />}
            <span className="text-xs sm:text-sm font-bold truncate">{fixture.homeTeam}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {matchDTO?.isFact && !unlockedFacts[matchDTO.id] ? (
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-green-400">{matchDTO.scoreA}</span>
                <span className="text-white/20 font-black text-xs sm:text-sm">VS</span>
                <span className="text-xl sm:text-2xl font-black text-green-400">{matchDTO.scoreB}</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] ml-1">Fact</Badge>
              </div>
            ) : (
              <>
                <Input type="number" min="0"
                  value={overrideInputs.current[overrideKey]?.scoreA ?? override?.scoreA?.toString() ?? ""}
                  onChange={(e) => fixture.homeTeamId && fixture.awayTeamId && handleScoreChange(fixture.homeTeamId, fixture.awayTeamId, "A", e.target.value)}
                  onBlur={() => fixture.homeTeamId && fixture.awayTeamId && handleScoreBlur(fixture.homeTeamId, fixture.awayTeamId)}
                  className="w-10 sm:w-12 h-9 sm:h-10 text-center text-base sm:text-lg font-bold bg-zinc-900 border-white/10" placeholder="-" />
                <span className="text-white/20 font-black text-xs sm:text-sm">VS</span>
                <Input type="number" min="0"
                  value={overrideInputs.current[overrideKey]?.scoreB ?? override?.scoreB?.toString() ?? ""}
                  onChange={(e) => fixture.homeTeamId && fixture.awayTeamId && handleScoreChange(fixture.homeTeamId, fixture.awayTeamId, "B", e.target.value)}
                  onBlur={() => fixture.homeTeamId && fixture.awayTeamId && handleScoreBlur(fixture.homeTeamId, fixture.awayTeamId)}
                  className="w-10 sm:w-12 h-9 sm:h-10 text-center text-base sm:text-lg font-bold bg-zinc-900 border-white/10" placeholder="-" />
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2 w-[90px] sm:w-[130px]">
            <span className="text-xs sm:text-sm font-bold truncate text-right">{fixture.awayTeam}</span>
            {fixture.awayTeamId && <img src={getFlagImageUrl(fixture.awayTeamId, 28)} alt="" className="h-6 w-6 object-contain" />}
            {isSet && !matchDTO?.isFact && fixture.homeTeamId && fixture.awayTeamId && (
              <Button variant="ghost" size="icon" onClick={() => handleClearResult(fixture.homeTeamId!, fixture.awayTeamId!)} className="h-5 w-5 text-white/20 hover:text-red-400">
                <RotateCcw className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Prediction Row */}
        {session?.user && !matchDTO?.isFact && matchDTO && (
          <>
            {locked ? (
              <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-t border-white/5">
                <span className="text-[9px] text-red-400/50 font-medium uppercase tracking-wider">Locked</span>
                {hasGuess ? (
                  <span className="text-xs text-white/40">Predicted: <span className="text-white/70 font-bold">{guess.scoreA}-{guess.scoreB}</span></span>
                ) : (
                  <span className="text-xs text-white/20">No prediction</span>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 bg-yellow-500/[0.03] border-t border-yellow-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-yellow-400/60 font-medium uppercase tracking-wider">Pick winner</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleQuickPick(guessKey, true)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        !isNaN(parseInt(gInputs.scoreA)) && !isNaN(parseInt(gInputs.scoreB)) && parseInt(gInputs.scoreA) > parseInt(gInputs.scoreB)
                          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                          : "bg-zinc-800/50 border-white/10 text-white/60 hover:bg-zinc-700/50")}>
                      {fixture.homeTeamId && <img src={getFlagImageUrl(fixture.homeTeamId, 20)} alt="" className="h-4 w-4 object-contain inline mr-1" />}{fixture.homeTeam}
                    </button>
                    <span className="text-white/20 text-xs">vs</span>
                    <button onClick={() => handleQuickPick(guessKey, false)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        !isNaN(parseInt(gInputs.scoreA)) && !isNaN(parseInt(gInputs.scoreB)) && parseInt(gInputs.scoreB) > parseInt(gInputs.scoreA)
                          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                          : "bg-zinc-800/50 border-white/10 text-white/60 hover:bg-zinc-700/50")}>
                      {fixture.awayTeamId && <img src={getFlagImageUrl(fixture.awayTeamId, 20)} alt="" className="h-4 w-4 object-contain inline mr-1" />}{fixture.awayTeam}
                    </button>
                    {savingGuess === guessKey && <Save className="h-3 w-3 text-yellow-500/50 animate-pulse shrink-0" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-yellow-400/60 font-medium uppercase tracking-wider">Score</span>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" value={gInputs.scoreA}
                      onChange={(e) => handleGuessChange(guessKey, "A", e.target.value)}
                      className="w-11 sm:w-14 h-8 text-center text-xs sm:text-sm font-bold bg-zinc-900/50 border-yellow-500/20 text-yellow-200/90" placeholder="-" />
                    <span className="text-yellow-500/40 font-black text-xs">:</span>
                    <Input type="number" min="0" value={gInputs.scoreB}
                      onChange={(e) => handleGuessChange(guessKey, "B", e.target.value)}
                      className="w-11 sm:w-14 h-8 text-center text-xs sm:text-sm font-bold bg-zinc-900/50 border-yellow-500/20 text-yellow-200/90" placeholder="-" />
                    {savingGuess === guessKey ? (
                      <Save className="h-3 w-3 text-yellow-500/50 animate-pulse shrink-0" />
                    ) : hasGuess ? (
                      <CheckCircle2 className="h-3 w-3 text-green-400/70 shrink-0" />
                    ) : null}
                    <Button size="sm" onClick={() => handleSubmitGuess(guessKey)}
                      disabled={savingGuess === guessKey || gInputs.scoreA === "" || gInputs.scoreB === ""}
                      className="h-7 text-[10px] bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-2.5">
                      {savingGuess === guessKey ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Fact result */}
        {session?.user && matchDTO?.isFact && (
          <div className="flex items-center justify-between px-3 py-2 bg-green-500/[0.03] border-t border-green-500/10">
            <span className="text-[9px] text-green-400/60 font-medium uppercase tracking-wider">Result</span>
            {guess ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50">{guess.scoreA}-{guess.scoreB}</span>
                <span className={cn("font-bold",
                  matchDTO.scoreA != null && matchDTO.scoreB != null
                    ? calcPoints(guess.scoreA, guess.scoreB, matchDTO.scoreA, matchDTO.scoreB) >= 300
                      ? "text-yellow-400" : "text-green-400"
                    : "text-white/30")}>
                  {matchDTO.scoreA != null && matchDTO.scoreB != null
                    ? `${calcPoints(guess.scoreA, guess.scoreB, matchDTO.scoreA, matchDTO.scoreB)} chips` : "?"}
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/30">No prediction</span>
            )}
          </div>
        )}

        {/* Admin */}
        {isAdmin && matchDTO && (
          <div className="flex items-center justify-between px-3 py-2 bg-red-500/[0.03] border-t border-red-500/10">
            <span className="text-[9px] text-red-400/60 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Panel
            </span>
            <div className="flex items-center gap-2">
              {matchDTO.isFact && !unlockedFacts[matchDTO.id] ? (
                <Button variant="ghost" size="sm"
                  onClick={() => fixture.homeTeamId && fixture.awayTeamId && handleUnlockFact(fixture.homeTeamId, fixture.awayTeamId, matchDTO)}
                  className="h-6 text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold uppercase tracking-wider px-2">
                  Modify Official Result
                </Button>
              ) : (
                <>
                  {unlockedFacts[matchDTO.id] && (
                    <Button variant="ghost" size="sm"
                      onClick={() => fixture.homeTeamId && fixture.awayTeamId && handleCancelUnlock(fixture.homeTeamId, fixture.awayTeamId, matchDTO.id)}
                      className="h-6 text-[9px] text-white/40 hover:text-white font-bold uppercase tracking-wider px-2">Cancel</Button>
                  )}
                  {unlockedFacts[matchDTO.id] && (
                    <Button variant="ghost" size="sm"
                      onClick={() => handleAdminDeleteFact(matchDTO.id)} disabled={submittingAdminId === matchDTO.id}
                      className="h-6 text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold uppercase tracking-wider px-2">Delete</Button>
                  )}
                  <Button size="sm"
                    disabled={submittingAdminId === matchDTO.id}
                    onClick={() => {
                      const local = overrideInputs.current[overrideKey] ?? override
                      const a = local?.scoreA != null ? Number(local.scoreA) : undefined
                      const b = local?.scoreB != null ? Number(local.scoreB) : undefined
                      if (a == null || b == null || isNaN(a) || isNaN(b)) return
                      handleAdminSubmitFact(matchDTO.id, a, b)
                    }}
                    className="h-6 text-[9px] bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest px-2.5">
                    {submittingAdminId === matchDTO.id ? (
                      <div className="h-3 w-3 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                    ) : unlockedFacts[matchDTO.id] ? "Save Updated Result" : "Submit Official Result"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: "World Cup 2026 Predictions", url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Live Tournament Mode</Badge>
            <Button variant="ghost" size="sm" onClick={handleShare} className="h-6 text-[10px] text-white/40 hover:text-white gap-1 px-2">
              <Share2 className="h-3 w-3" /> Invite
            </Button>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
            Live <span className="text-green-500">Results</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            {session?.user
              ? "Pick a winner or enter exact scores. Exact result = 300 chips, correct winner = 100 chips. Quick Pick (1-0/0-1) = 200 chips, Full Score = 400 chips."
              : "Sign in to predict and compete. Tap a team to Quick Pick!"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={resetConfig} className="border-white/10 hover:bg-red-500/10 hover:text-red-400 text-[11px] h-8">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={simulate} disabled={isRunning} className="bg-green-600 hover:bg-green-500 text-[11px] h-8">
            {isRunning ? <div className="h-3 w-3 border-2 border-white/20 border-t-white animate-spin rounded-full mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            Recalc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 mb-4 flex-wrap gap-0.5 h-auto min-h-9 w-full justify-start">
              {scheduleDays.map((day) => {
                const d = new Date(day.date + "T12:00:00")
                const month = d.toLocaleDateString("en-US", { month: "short" })
                const num = d.getDate()
                return (
                  <TabsTrigger key={day.date} value={day.date} className="data-[state=active]:bg-zinc-800 text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-1 shrink-0 leading-tight text-center">
                    <span className="block">{month}</span>
                    <span className="block font-bold">{num}</span>
                  </TabsTrigger>
                )
              })}
              <TabsTrigger value="leaderboard" className={cn("data-[state=active]:bg-zinc-800 data-[state=active]:text-yellow-400 gap-1 text-[10px] px-2 py-1 shrink-0", !factMatchesExist && "hidden")}>
                <Trophy className="h-3 w-3" /> <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className={cn("animate-in fade-in slide-in-from-left-2 duration-300", !factMatchesExist && "hidden")}>
              <LeaderboardPanel leaderboard={leaderboard} onRefresh={fetchLeaderboard} />
            </TabsContent>

            {scheduleDays.map((day) => (
              <TabsContent key={day.date} value={day.date} className="animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="grid grid-cols-1 gap-3">
                  {day.matches.map((fixture) => renderMatchCard(fixture))}
                  {!session?.user && (
                    <div className="text-center py-8 text-white/30 border border-dashed border-white/10 rounded-xl">
                      <p className="text-sm font-bold mb-1">Sign in to make predictions</p>
                      <p className="text-xs">Quick Pick or Full Score — compete with your office!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <Card className="bg-card/50 backdrop-blur-md border-white/10 overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 px-4 py-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-green-400" />
                Live Group Standings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] sm:h-[400px]">
                <div className="p-3 space-y-6">
                  {Object.keys(factStandings).length === 0 ? (
                    <div className="text-center py-8 text-white/30">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-[10px] font-bold">No fact results yet</p>
                      <p className="text-[9px] mt-1">Standings appear here once matches are scored.</p>
                    </div>
                  ) : (
                    Object.entries(factStandings).map(([groupId, standings]) => (
                    <div key={groupId} className="space-y-2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-1">Group {groupId}</div>
                      <div className="space-y-1.5">
                        {(standings as any[]).slice(0, 4).map((s: any, idx: number) => {
                          const team = groupTeamsMap[s.teamId]
                          return (
                            <div key={s.teamId} className="flex items-center justify-between text-[10px] overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-white/20 w-2.5 text-[9px] shrink-0">{idx + 1}</span>
                                {team && <img src={getFlagImageUrl(s.teamId, 20)} alt="" className="h-4 w-4 object-contain shrink-0" />}
                                <span className={cn("truncate", idx < 2 ? "text-white font-medium" : "text-white/40")}>{team?.name}</span>
                              </div>
                              <div className="flex gap-2 font-mono">
                                <span className="text-white/30 text-[9px]">{s.goalDifference > 0 ? "+" : ""}{s.goalDifference}</span>
                                <span className="text-white font-bold w-3 text-right text-[10px]">{s.points}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {session?.user && leaderboard && leaderboard.leaderboard.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-md border-white/10 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5 px-4 py-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  Top Predictors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {leaderboard.leaderboard.slice(0, 5).map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold", entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-zinc-300" : entry.rank === 3 ? "text-amber-600" : "text-white/20")}>
                          {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                        </span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={entry.image ?? undefined} />
                          <AvatarFallback className="text-[6px] bg-zinc-800"><User className="h-2.5 w-2.5" /></AvatarFallback>
                        </Avatar>
                        <span className="text-white/70 truncate max-w-[80px]">{entry.name ?? "Anonymous"}</span>
                      </div>
                      <span className="font-bold text-yellow-400">{entry.totalPoints}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="border-t border-white/5 p-2.5">
                <Link href="/ranking">
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-[10px] h-7">
                    Full Rankings <ChevronRight className="h-2.5 w-2.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          <Link href="/bracket">
            <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white/60 hover:text-white text-xs h-8">
              View Bracket <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function LeaderboardPanel({ leaderboard, onRefresh }: { leaderboard: LeaderboardData | null; onRefresh: () => void }) {
  return (
    <div className="space-y-4 pt-[150px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
            <span className="text-yellow-400">Prediction</span> Leaderboard
          </h2>
           <p className="text-[10px] text-muted-foreground">Exact result = 300 chips, correct winner = 100 chips.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-white/10 text-[10px] h-7">
          <RotateCcw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {leaderboard && leaderboard.matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {leaderboard.matches.map((m) => (
            <Badge key={m.id} className="bg-green-500/10 text-green-400 border-green-500/20 text-[8px] px-1.5 py-0">{m.label}: {m.score}</Badge>
          ))}
        </div>
      )}

      {leaderboard && leaderboard.leaderboard.length > 0 ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 w-10">Rank</th>
                <th className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40">User</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40">Chips</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Exact</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Winner</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.leaderboard.map((entry) => (
                <tr key={entry.userId} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-3 py-2.5">
                    <span className={cn("font-bold", entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-zinc-300" : entry.rank === 3 ? "text-amber-600" : "text-white/30")}>
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={entry.image ?? undefined} />
                        <AvatarFallback className="text-[6px] bg-zinc-800"><User className="h-2.5 w-2.5" /></AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white/80 truncate max-w-[100px]">{entry.name ?? "Anonymous"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-yellow-400">{entry.totalPoints}</td>
                  <td className="px-3 py-2.5 text-center text-green-400 hidden sm:table-cell">{entry.exactGuesses}</td>
                  <td className="px-3 py-2.5 text-center text-blue-400 hidden sm:table-cell">{entry.correctWinners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-white/30">
          <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="font-bold text-sm">No predictions scored yet</p>
          <p className="text-[10px] mt-1">Predictions appear here once matches are confirmed.</p>
        </div>
      )}
    </div>
  )
}

import teamsData from "@/data/teams.json"
const groupTeamsMap: Record<string, { id: string; name: string; flag: string }> = {}
for (const team of teamsData as { id: string; name: string; flag: string }[]) {
  groupTeamsMap[team.id] = team
}



