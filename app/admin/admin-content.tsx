"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RotateCcw, Play, CheckCircle2, ChevronRight, Trophy, Save, Search, Settings, HelpCircle, AlertTriangle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import teamsData from "@/data/teams.json"

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
}

// Map team names to flags
const teamFlagMap: Record<string, string> = {}
for (const team of teamsData as { name: string; flag: string }[]) {
  teamFlagMap[team.name.toLowerCase().trim()] = team.flag
}

function getFlag(teamName: string | null): string {
  if (!teamName) return "🏳️"
  return teamFlagMap[teamName.toLowerCase().trim()] || "🏳️"
}

// Map round IDs to readable labels
const roundLabels: Record<string, string> = {
  "group": "Group Stage",
  "roundOf32": "Round of 32",
  "roundOf16": "Round of 16",
  "quarterFinal": "Quarter-Finals",
  "semiFinal": "Semi-Finals",
  "final": "Final",
}

export function AdminContent() {
  const { data: session } = useSession()
  const { simulate, isRunning } = useSimulation()
  const [matches, setMatches] = useState<MatchDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  
  // Filtering and searching state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "fact">("all")
  
  // Track edit modes for individual matches
  const [unlockedMatches, setUnlockedMatches] = useState<Record<string, boolean>>({})
  const [inputScores, setInputScores] = useState<Record<string, { scoreA: string; scoreB: string }>>({})

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches")
      if (res.ok) {
        const data: MatchDTO[] = await res.json()
        setMatches(data)
        
        // Initialize input scores state
        const scores: Record<string, { scoreA: string; scoreB: string }> = {}
        data.forEach(m => {
          scores[m.id] = {
            scoreA: m.scoreA !== null ? m.scoreA.toString() : "",
            scoreB: m.scoreB !== null ? m.scoreB.toString() : "",
          }
        })
        setInputScores(scores)
      }
    } catch (e) {
      toast.error("Failed to load matches from database")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleScoreChange = (matchId: string, side: "A" | "B", value: string) => {
    setInputScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side === "A" ? "scoreA" : "scoreB"]: value
      }
    }))
  }

  const handleSaveResult = async (matchId: string) => {
    const scores = inputScores[matchId]
    if (!scores) return

    const parsedA = parseInt(scores.scoreA)
    const parsedB = parseInt(scores.scoreB)

    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      toast.error("Please enter valid, non-negative scores for both teams.")
      return
    }

    setSubmittingId(matchId)
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA: parsedA, scoreB: parsedB }),
      })

      if (res.ok) {
        toast.success("Official result saved! Leaderboard scores recalculated successfully.")
        
        // Relock this match card
        setUnlockedMatches(prev => ({ ...prev, [matchId]: false }))
        await fetchMatches()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update match result.")
      }
    } catch (e) {
      toast.error("Network error. Failed to save official result.")
    } finally {
      setSubmittingId(null)
    }
  }

  const toggleUnlock = (matchId: string) => {
    setUnlockedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }))
  }

  // Filter matches based on search term, round, and completion status
  const filteredMatches = matches.filter(m => {
    const matchesSearch = searchTerm === "" || 
      (m.teamAName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       m.teamBName?.toLowerCase().includes(searchTerm.toLowerCase()))
       
    const matchesRound = selectedRound === "all" || m.round === selectedRound
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "fact" && m.isFact) || 
      (statusFilter === "pending" && !m.isFact)

    return matchesSearch && matchesRound && matchesStatus
  })

  // Group filtered matches by round to keep list structured
  const matchesByRound: Record<string, MatchDTO[]> = {}
  filteredMatches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = []
    matchesByRound[m.round].push(m)
  })

  const handleSimulate = async () => {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        try {
          simulate()
          resolve()
        } catch (e) {
          reject(e)
        }
      }),
      {
        loading: "Running Monte Carlo tournament simulation...",
        success: "Monte Carlo simulation completed! Standings and brackets updated.",
        error: "Simulation failed. Please try again."
      }
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-2.5 py-0.5 font-bold tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> ADMINISTRATOR PANEL
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground">
            Enter Match <span className="text-red-500">Results</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Submit official real-world match outcomes below. Saving a result automatically marks the match as a "Fact" and recalculates tournament predictor points for all players.
          </p>
        </div>
        
        <div className="flex gap-3 items-center shrink-0">
          <Link href="/timeline/live">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-xs h-9">
              View Live Page <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
          <Button 
            onClick={handleSimulate} 
            disabled={isRunning} 
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-9 px-4 flex items-center gap-1.5"
          >
            {isRunning ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run Tournament Sim
          </Button>
        </div>
      </div>

      {/* Control bar: Search + Filter tabs */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-xl backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            type="text"
            placeholder="Search matches by team name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-zinc-900 border-white/10 text-sm placeholder:text-white/20 text-white"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="h-10 px-3 bg-zinc-900 border border-white/10 rounded-lg text-xs font-bold text-white uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Rounds</option>
            {Object.entries(roundLabels).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          <div className="flex border border-white/10 bg-zinc-900 p-0.5 rounded-lg h-10">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === "all" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === "pending" ? "bg-yellow-500/20 text-yellow-400" : "text-white/40 hover:text-white/70"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("fact")}
              className={cn(
                "px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === "fact" ? "bg-green-500/20 text-green-400" : "text-white/40 hover:text-white/70"
              )}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Main content list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 border-4 border-white/10 border-t-red-500 animate-spin rounded-full" />
          <p className="text-sm text-white/40">Loading tournament matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <AlertTriangle className="h-10 w-10 mx-auto text-yellow-500/50 mb-3" />
          <h3 className="font-bold text-base text-white/80">No matches found</h3>
          <p className="text-xs text-white/30 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting a different round, or resetting the status filters.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(roundLabels).map(([roundId, roundLabel]) => {
            const roundMatches = matchesByRound[roundId]
            if (!roundMatches || roundMatches.length === 0) return null

            return (
              <div key={roundId} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 flex items-center gap-2">
                  <span>{roundLabel}</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-white/10 bg-white/5 px-2 py-0">
                    {roundMatches.length}
                  </Badge>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roundMatches.map((m) => {
                    const isCompleted = m.isFact
                    const isEditing = unlockedMatches[m.id]
                    const currentScores = inputScores[m.id] || { scoreA: "", scoreB: "" }
                    const hasTeams = !!(m.teamAName && m.teamBName)

                    return (
                      <Card 
                        key={m.id} 
                        className={cn(
                          "bg-card/45 border-white/10 transition-all backdrop-blur-sm overflow-hidden",
                          isCompleted && !isEditing ? "border-green-500/20 bg-green-500/[0.01]" : "",
                          isEditing ? "border-red-500/40 shadow-lg shadow-red-500/5 bg-red-500/[0.01]" : ""
                        )}
                      >
                        {/* Card Top Header: match info */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                            Match #{m.matchOrder + 1} {m.groupId ? `• Group ${m.groupId}` : ""}
                          </span>
                          {isCompleted && !isEditing ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Fact Result
                            </Badge>
                          ) : isEditing ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] font-bold">
                              Modifying
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] font-bold">
                              Pending
                            </Badge>
                          )}
                        </div>

                        <CardContent className="p-5 flex flex-col justify-between h-[160px]">
                          {/* Teams & Score inputs */}
                          <div className="flex items-center justify-between gap-2">
                            {/* Team A Info */}
                            <div className="flex flex-col items-center gap-1 w-[90px] shrink-0 text-center">
                              <span className="text-3xl leading-none">{getFlag(m.teamAName)}</span>
                              <span className="text-[11px] font-bold truncate max-w-full text-white/90">
                                {m.teamAName || "Pending Team"}
                              </span>
                            </div>

                            {/* Center Score Input / Display */}
                            <div className="flex items-center gap-2">
                              {!hasTeams ? (
                                <div className="text-[10px] font-medium text-white/20 py-2 uppercase tracking-wide">
                                  TBD vs TBD
                                </div>
                              ) : isCompleted && !isEditing ? (
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl font-black font-mono text-green-400">{m.scoreA}</span>
                                  <span className="text-white/20 font-black text-xs">:</span>
                                  <span className="text-3xl font-black font-mono text-green-400">{m.scoreB}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={currentScores.scoreA}
                                    onChange={(e) => handleScoreChange(m.id, "A", e.target.value)}
                                    className="w-12 h-12 text-center text-xl font-bold bg-zinc-900 border-white/10 focus-visible:ring-red-500 text-white rounded-lg"
                                    placeholder="-"
                                    disabled={submittingId === m.id}
                                  />
                                  <span className="text-white/20 font-bold text-xs">:</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={currentScores.scoreB}
                                    onChange={(e) => handleScoreChange(m.id, "B", e.target.value)}
                                    className="w-12 h-12 text-center text-xl font-bold bg-zinc-900 border-white/10 focus-visible:ring-red-500 text-white rounded-lg"
                                    placeholder="-"
                                    disabled={submittingId === m.id}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Team B Info */}
                            <div className="flex flex-col items-center gap-1 w-[90px] shrink-0 text-center">
                              <span className="text-3xl leading-none">{getFlag(m.teamBName)}</span>
                              <span className="text-[11px] font-bold truncate max-w-full text-white/90">
                                {m.teamBName || "Pending Team"}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-4 pt-3 border-t border-white/5">
                            {!hasTeams ? (
                              <Button 
                                disabled
                                className="w-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/20 h-8"
                              >
                                Match teams not resolved
                              </Button>
                            ) : isCompleted && !isEditing ? (
                              <Button
                                variant="outline"
                                onClick={() => toggleUnlock(m.id)}
                                className="w-full border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 h-8"
                              >
                                Modify Official Result
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleUnlock(m.id)}
                                    className="border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50 h-8 px-2"
                                    disabled={submittingId === m.id}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleSaveResult(m.id)}
                                  disabled={submittingId === m.id}
                                  className={cn(
                                    "flex-1 text-[10px] font-black uppercase tracking-widest text-white h-8",
                                    isEditing ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
                                  )}
                                >
                                  {submittingId === m.id ? (
                                    <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full mx-auto" />
                                  ) : isEditing ? (
                                    "Save Updated Result"
                                  ) : (
                                    "Submit Official Result"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
