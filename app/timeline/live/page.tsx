"use client"

import React, { useState, useMemo } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import {
  getTeamsByGroup,
  getTeam,
  getGroupMatchDate,
  getKnockoutMatchDate,
  getTeamByName,
  parseMatchDateTime,
  type Team
} from "@/lib/simulation"
import matchesData from "@/fifa_2026_group_stage.json"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  RotateCcw,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  ChevronLeft,
  ArrowUpDown
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LiveResultsPage() {
  const {
    tournamentState,
    updateMatchResult,
    simulate,
    isRunning,
    resetConfig,
    result,
    currentTournamentDate,
    setCurrentTournamentDate
  } = useSimulation()

  const groups = useMemo(() => getTeamsByGroup(), [])
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "upcoming" | "compare">("pending")
  const [stageFilter, setStageFilter] = useState<"all" | "group" | "knockout">("all")

  // Sorting state for standings comparison
  const [sortField, setSortField] = useState<string>("points")
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(prev => !prev)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  // Dynamic Standings vs Predictions comparison data day-by-day
  const comparisonData = useMemo(() => {
    // 1. Initialize real stats for all teams
    const realStatsMap: Record<string, {
      played: number
      won: number
      drawn: number
      lost: number
      goalsFor: number
      goalsAgainst: number
      goalDifference: number
      points: number
    }> = {}

    const allTeamsList = Object.values(groups).flat()
    allTeamsList.forEach((team) => {
      realStatsMap[team.id] = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }
    })

    // 2. Compute real stats from matches scheduled on or before current date that have overrides
    const currentLimit = new Date(currentTournamentDate + "T23:59:59.999Z").getTime()
    
    matchesData.matches.forEach((match) => {
      const teamA = getTeamByName(match.home_team)
      const teamB = getTeamByName(match.away_team)
      const matchTime = parseMatchDateTime(match.date, match.time).getTime()

      if (matchTime <= currentLimit) {
        const key = `${teamA.id}_${teamB.id}`
        const reverseKey = `${teamB.id}_${teamA.id}`
        const override = tournamentState.matchOverrides[key] || tournamentState.matchOverrides[reverseKey]

        if (override) {
          const isReverse = !!tournamentState.matchOverrides[reverseKey]
          const scoreA = isReverse ? override.scoreB : override.scoreA
          const scoreB = isReverse ? override.scoreA : override.scoreB

          const statsA = realStatsMap[teamA.id]
          const statsB = realStatsMap[teamB.id]

          if (statsA && statsB) {
            statsA.played++
            statsB.played++
            statsA.goalsFor += scoreA
            statsA.goalsAgainst += scoreB
            statsB.goalsFor += scoreB
            statsB.goalsAgainst += scoreA

            if (scoreA > scoreB) {
              statsA.won++
              statsA.points += 3
              statsB.lost++
            } else if (scoreB > scoreA) {
              statsB.won++
              statsB.points += 3
              statsA.lost++
            } else {
              statsA.drawn++
              statsA.points += 1
              statsB.drawn++
              statsB.points += 1
            }
            statsA.goalDifference = statsA.goalsFor - statsA.goalsAgainst
            statsB.goalDifference = statsB.goalsFor - statsB.goalsAgainst
          }
        }
      }
    })

    // 3. Assemble complete rows with both real stats and Monte Carlo prediction probabilities
    const rows = allTeamsList.map((team) => {
      const real = realStatsMap[team.id]
      const prediction = result?.teamProbabilities[team.id] || {
        groupAdvance: 0,
        roundOf32: 0,
        roundOf16: 0,
        quarterFinal: 0,
        semiFinal: 0,
        final: 0,
        champion: 0
      }

      return {
        team,
        real,
        prediction
      }
    })

    // 4. Sort rows based on sortField and sortAsc
    rows.sort((a, b) => {
      let valA: any
      let valB: any

      if (sortField === "team") {
        valA = a.team.name
        valB = b.team.name
      } else if (sortField === "group") {
        valA = a.team.group
        valB = b.team.group
      } else if (sortField === "played" || sortField === "points" || sortField === "goalDifference" || sortField === "goalsFor") {
        valA = a.real[sortField]
        valB = b.real[sortField]
      } else {
        valA = (a.prediction as any)[sortField] ?? 0
        valB = (b.prediction as any)[sortField] ?? 0
      }

      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      } else {
        if (valA !== valB) {
          return sortAsc ? valA - valB : valB - valA
        }
        if (a.real.points !== b.real.points) {
          return b.real.points - a.real.points
        }
        return b.real.goalDifference - a.real.goalDifference
      }
    })

    return rows
  }, [groups, currentTournamentDate, tournamentState, result, sortField, sortAsc])


  // Fast pre-populated team mapping for stats
  const teamsMap = useMemo(() => {
    const map: Record<string, Team> = {}
    Object.values(groups).flat().forEach((team) => {
      map[team.id] = team
    })
    return map
  }, [groups])

  // Virtual date presets
  const datePresets = [
    { label: "Start (Jun 11)", date: "2026-06-11" },
    { label: "Midpoint (Jun 18)", date: "2026-06-18" },
    { label: "Groups Over (Jun 27)", date: "2026-06-27" },
    { label: "R32 Over (Jul 03)", date: "2026-07-03" },
    { label: "Final (Jul 19)", date: "2026-07-19" }
  ]
 
  // Construct all possible matches in the tournament based on groups and active simulation
  const allMatches = useMemo(() => {
    const list: any[] = []
 
    // 1. Group stage matches (chronological from JSON)
    matchesData.matches.forEach((match) => {
      const teamA = getTeamByName(match.home_team)
      const teamB = getTeamByName(match.away_team)
      
      list.push({
        id: `group_${match.group}_${match.match_number}`,
        stage: `Group ${match.group}`,
        teamA,
        teamB,
        date: parseMatchDateTime(match.date, match.time),
        key: `${teamA.id}_${teamB.id}`,
        reverseKey: `${teamB.id}_${teamA.id}`,
        isGroup: true,
        stadium: match.stadium,
        matchNumber: match.match_number
      })
    })
 
    // 2. Knockout matches (derived from the representative simulation run)
    if (result) {
      result.knockoutBracket.forEach((round) => {
        round.matches.forEach((match) => {
          if (match.teamA && match.teamB) {
            const teamA = teamsMap[match.teamA]
            const teamB = teamsMap[match.teamB]
            if (teamA && teamB) {
              list.push({
                id: `knockout_${round.round}_${match.matchId}`,
                stage: round.round,
                teamA,
                teamB,
                date: getKnockoutMatchDate(round.round, match.matchId),
                key: `${teamA.id}_${teamB.id}`,
                reverseKey: `${teamB.id}_${teamA.id}`,
                isGroup: false
              })
            }
          }
        })
      })
    }
 
    // Sort allMatches chronologically: group stage first, then knockout rounds perfectly sequenced
    list.sort((a, b) => {
      const timeDiff = a.date.getTime() - b.date.getTime()
      if (timeDiff !== 0) return timeDiff
      
      // If dates are identical, sort by group stage match_number
      if (a.matchNumber && b.matchNumber) {
        return a.matchNumber - b.matchNumber
      }
      return a.id.localeCompare(b.id)
    })

    return list
  }, [result, teamsMap])

  // Separate matches by category based on current virtual date and overrides
  const categorizedMatches = useMemo(() => {
    const currentLimit = new Date(currentTournamentDate + "T23:59:59.999Z").getTime()

    const pending: any[] = []
    const completed: any[] = []
    const upcoming: any[] = []

    allMatches.forEach((match) => {
      // Filter by stage if selected
      if (stageFilter === "group" && !match.isGroup) return
      if (stageFilter === "knockout" && match.isGroup) return

      const matchTime = match.date.getTime()
      const isFinished = matchTime <= currentLimit
      const override = tournamentState.matchOverrides[match.key] || tournamentState.matchOverrides[match.reverseKey]
      const isSet = !!override

      const matchData = {
        ...match,
        override,
        isSet
      }

      if (isSet) {
        completed.push(matchData)
      } else if (isFinished) {
        pending.push(matchData)
      } else {
        upcoming.push(matchData)
      }
    })

    // Sort completed/pending by date ascending, upcoming by date ascending
    const sortByDate = (a: any, b: any) => a.date.getTime() - b.date.getTime()

    return {
      pending: pending.sort(sortByDate),
      completed: completed.sort(sortByDate),
      upcoming: upcoming.sort(sortByDate)
    }
  }, [allMatches, currentTournamentDate, tournamentState.matchOverrides, stageFilter])

  const activeMatches = useMemo(() => {
    if (activeTab === "compare") return []
    return categorizedMatches[activeTab as keyof typeof categorizedMatches] || []
  }, [categorizedMatches, activeTab])

  const handleScoreChange = (
    teamAId: string,
    teamBId: string,
    side: "A" | "B",
    value: string,
    isGroup: boolean
  ) => {
    if (value === "") {
      // Clear the override for this match completely
      updateMatchResult(teamAId, teamBId, null)
      return
    }

    const scoreValue = parseInt(value)
    if (isNaN(scoreValue) || scoreValue < 0) return

    const key = `${teamAId}_${teamBId}`
    const reverseKey = `${teamBId}_${teamAId}`
    const isReverse = !!tournamentState.matchOverrides[reverseKey]
    const activeKey = isReverse ? reverseKey : key
    const current = tournamentState.matchOverrides[activeKey] || { scoreA: 0, scoreB: 0 }

    const updatedScoreA = side === "A" ? (isReverse ? current.scoreB : scoreValue) : (isReverse ? scoreValue : current.scoreA)
    const updatedScoreB = side === "B" ? (isReverse ? current.scoreA : scoreValue) : (isReverse ? scoreValue : current.scoreB)

    // Determine winner based on scores
    let winnerId: string | undefined = undefined
    if (updatedScoreA > updatedScoreB) {
      winnerId = isReverse ? teamBId : teamAId
    } else if (updatedScoreB > updatedScoreA) {
      winnerId = isReverse ? teamAId : teamBId
    } else if (!isGroup) {
      // Knockout matches need a penalty winner if scores are equal. Default to teamA.
      winnerId = current.winnerId || (isReverse ? teamBId : teamAId)
    }

    updateMatchResult(
      isReverse ? teamBId : teamAId,
      isReverse ? teamAId : teamBId,
      {
        scoreA: isReverse ? updatedScoreB : updatedScoreA,
        scoreB: isReverse ? updatedScoreA : updatedScoreB,
        winnerId
      }
    )
  }

  const handlePenaltyWinnerChange = (teamAId: string, teamBId: string, winnerId: string) => {
    const key = `${teamAId}_${teamBId}`
    const reverseKey = `${teamBId}_${teamAId}`
    const isReverse = !!tournamentState.matchOverrides[reverseKey]
    const activeKey = isReverse ? reverseKey : key
    const current = tournamentState.matchOverrides[activeKey]

    if (!current) return

    updateMatchResult(
      isReverse ? teamBId : teamAId,
      isReverse ? teamAId : teamBId,
      {
        ...current,
        winnerId
      }
    )
  }

  const handleClearResult = (teamAId: string, teamBId: string) => {
    updateMatchResult(teamAId, teamBId, null)
  }

  const handleDateShift = (days: number) => {
    const d = new Date(currentTournamentDate)
    d.setDate(d.getDate() + days)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    setCurrentTournamentDate(`${year}-${month}-${day}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Title Header */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-2">
            Tournament Live Hub
          </Badge>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground md:text-5xl">
            Match <span className="text-emerald-500 text-glow-green">Results Entry</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            Input match outcomes as they conclude. The simulation dynamically captures your real-world overrides to instantly recalculate all paths to glory.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={resetConfig}
            className="border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-xs h-9 sm:h-10"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Results
          </Button>
          <Button
            onClick={simulate}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 sm:h-10 px-4"
          >
            {isRunning ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Recalculate Odds
          </Button>
        </div>
      </div>

      {/* Date Controls & Info Banner */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Virtual Date Setting */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                Virtual Tournament Date
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateShift(-1)}
                className="h-8 w-8 text-white/50 hover:text-white border border-white/5 hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={currentTournamentDate}
                onChange={(e) => setCurrentTournamentDate(e.target.value)}
                className="w-40 h-9 text-center bg-zinc-950 border-white/10 text-white font-bold"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateShift(1)}
                className="h-8 w-8 text-white/50 hover:text-white border border-white/5 hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {datePresets.map((preset) => (
              <Button
                key={preset.date}
                variant="ghost"
                size="sm"
                onClick={() => setCurrentTournamentDate(preset.date)}
                className={cn(
                  "text-[10px] uppercase font-bold tracking-wider rounded-md h-7 px-2.5 transition-all border",
                  currentTournamentDate === preset.date
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "text-white/40 border-transparent hover:bg-white/5 hover:text-white"
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Live Counters Dashboard */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/60 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3 animate-pulse" /> Pending Finished
            </span>
            <span className="text-3xl font-black text-white leading-none">
              {categorizedMatches.pending.length}
            </span>
            <span className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">
              Needs actual scores
            </span>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/60 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3 w-3" /> Overridden Scores
            </span>
            <span className="text-3xl font-black text-white leading-none">
              {categorizedMatches.completed.length}
            </span>
            <span className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">
              Manual entries
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Match Lists Section / Full-width Comparison Section */}
        <div className={cn("space-y-6", activeTab === "compare" ? "lg:col-span-12" : "lg:col-span-8")}>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/30 border border-white/5 p-3 rounded-xl">
            <Tabs
              value={activeTab}
              onValueChange={(val: any) => setActiveTab(val)}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-zinc-950/80 border border-white/5 p-1 w-full sm:w-auto">
                <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs">
                  Needs Data ({categorizedMatches.pending.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1.5 text-xs">
                  Completed ({categorizedMatches.completed.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-1.5 text-xs">
                  Upcoming ({categorizedMatches.upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Standings vs Odds
                </TabsTrigger>
              </TabsList>
            </Tabs>
 
            {/* Stage filter dropdown or buttons - Hide in comparison view */}
            {activeTab !== "compare" && (
              <div className="flex items-center bg-zinc-950/80 border border-white/5 p-1 rounded-lg self-end sm:self-auto shrink-0">
                {(["all", "group", "knockout"] as const).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stage)}
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded transition-all",
                      stageFilter === stage
                        ? "bg-zinc-800 text-white"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            )}
          </div>
 
          {/* Comparative Standings vs Predictions View OR Match Cards List */}
          {activeTab === "compare" ? (
            <Card className="bg-zinc-900/20 backdrop-blur-md border-white/10 overflow-hidden rounded-2xl w-full shadow-2xl">
              <CardHeader className="bg-white/5 border-b border-white/5 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5 text-emerald-400 text-glow-green" />
                      Standings vs Predictions Tracker
                    </CardTitle>
                    <CardDescription className="text-xs text-white/40 mt-1">
                      Compare real standings (using user overrides up to {new Date(currentTournamentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}) against live Monte Carlo simulated advancement percentages.
                    </CardDescription>
                  </div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-lg shrink-0">
                    Day-by-Day Comparative Analysis
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {result ? (
                  <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-zinc-950/40 border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-white/40 select-none">
                        <th className="py-4 px-4 w-12 text-center">Rank</th>
                        <th 
                          onClick={() => handleSort("team")} 
                          className="py-4 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Team
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "team" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("group")} 
                          className="py-4 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors w-20 text-center"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            Group
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "group" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("played")} 
                          className="py-4 px-3 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-center w-16"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            GP
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "played" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("points")} 
                          className="py-4 px-3 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-center w-16 text-emerald-400"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            PTS
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "points" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("goalDifference")} 
                          className="py-4 px-3 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-center w-16"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            GD
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "goalDifference" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("goalsFor")} 
                          className="py-4 px-3 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-center w-16"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            GF
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "goalsFor" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("groupAdvance")} 
                          className="py-4 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-right w-28"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            Adv. Grp
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "groupAdvance" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("roundOf16")} 
                          className="py-4 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-right w-28"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            R16 %
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "roundOf16" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("champion")} 
                          className="py-4 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors text-right w-32 text-yellow-400"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            Champion %
                            <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === "champion" ? "text-emerald-400" : "text-white/20")} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-semibold">
                      {comparisonData.map((row, index) => (
                        <tr 
                          key={row.team.id}
                          className="hover:bg-white/5 transition-colors group/row"
                        >
                          <td className="py-3 px-4 text-center font-bold text-white/30">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl select-none group-hover/row:scale-110 transition-transform">{row.team.flag}</span>
                              <span className="font-black text-white group-hover/row:text-emerald-400 transition-colors">
                                {row.team.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-zinc-800/80 border border-white/5 text-white/70 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Group {row.team.group}
                            </span>
                          </td>
                          <td className={cn("py-3 px-3 text-center font-mono", sortField === "played" && "bg-white/5 font-bold")}>
                            {row.real.played}
                          </td>
                          <td className={cn("py-3 px-3 text-center font-mono font-bold", sortField === "points" ? "bg-white/5 text-emerald-400 text-glow-green" : "text-white")}>
                            {row.real.points}
                          </td>
                          <td className={cn("py-3 px-3 text-center font-mono font-bold", sortField === "goalDifference" && "bg-white/5", row.real.goalDifference > 0 ? "text-emerald-400/90" : row.real.goalDifference < 0 ? "text-red-400/90" : "text-white/40")}>
                            {row.real.goalDifference > 0 ? "+" : ""}{row.real.goalDifference}
                          </td>
                          <td className={cn("py-3 px-3 text-center font-mono text-white/60", sortField === "goalsFor" && "bg-white/5")}>
                            {row.real.goalsFor}
                          </td>
                          <td className={cn("py-3 px-4 text-right font-mono", sortField === "groupAdvance" && "bg-white/5")}>
                            <div className="flex items-center justify-end gap-2">
                              <div className="hidden sm:block w-12 bg-zinc-950 h-1.5 rounded-full overflow-hidden shrink-0 border border-white/5">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${row.prediction.groupAdvance}%` }}
                                />
                              </div>
                              <span className="font-bold text-white">
                                {row.prediction.groupAdvance}%
                              </span>
                            </div>
                          </td>
                          <td className={cn("py-3 px-4 text-right font-mono text-white/80", sortField === "roundOf16" && "bg-white/5")}>
                            <span className="font-bold">
                              {row.prediction.roundOf16}%
                            </span>
                          </td>
                          <td className={cn("py-3 px-4 text-right font-mono font-bold", sortField === "champion" ? "bg-white/5 text-yellow-400" : "text-yellow-500/80")}>
                            <div className="flex items-center justify-end gap-2">
                              <div className="hidden sm:block w-12 bg-zinc-950 h-1.5 rounded-full overflow-hidden shrink-0 border border-white/5">
                                <div 
                                  className="bg-yellow-500 h-full rounded-full" 
                                  style={{ width: `${row.prediction.champion}%` }}
                                />
                              </div>
                              <span className="font-black text-glow-yellow text-yellow-400">
                                {row.prediction.champion}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="p-8 sm:p-16 text-center flex flex-col items-center justify-center space-y-4 bg-zinc-950/20 backdrop-blur-sm min-h-[400px]">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 shadow-lg">
                      <TrendingUp className="h-8 w-8 text-emerald-400 text-glow-green animate-pulse" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Predictions Model Stopped
                      </h3>
                      <p className="text-xs text-white/40 leading-relaxed">
                        To compare live standings against Monte Carlo simulated probabilities (Advancement %, Champion %, etc.), you must trigger the predictive simulation run first.
                      </p>
                    </div>
                    <Button
                      onClick={simulate}
                      disabled={isRunning}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs h-10 px-6 rounded-lg shadow-lg shadow-emerald-950/50 transition-all duration-300 hover:scale-105"
                    >
                      {isRunning ? (
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Monte Carlo Simulation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMatches.length === 0 ? (
                <Card className="bg-zinc-900/10 border-white/5 p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <AlertCircle className="h-10 w-10 text-white/20" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    No Matches Found
                  </h3>
                  <p className="text-xs text-white/40 max-w-sm">
                    There are no matches currently matching this category and stage filter. Try adjusting your Virtual Tournament Date.
                  </p>
                </Card>
              ) : (
                activeMatches.map((match: any) => {
                  const override = match.override
                  const isSet = match.isSet
                  const isReverse = !!tournamentState.matchOverrides[match.reverseKey]
                  const scoreA = isSet ? (isReverse ? match.override.scoreB : match.override.scoreA) : ""
                  const scoreB = isSet ? (isReverse ? match.override.scoreA : match.override.scoreB) : ""
                  const showPenaltyChooser = !match.isGroup && isSet && scoreA === scoreB
 
                return (
                  <div
                    key={match.id}
                    className={cn(
                      "flex flex-col p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                      isSet
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50"
                        : "bg-card border-white/5 hover:border-white/10"
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        {match.stage}
                      </span>
                      <span className="text-[10px] font-bold text-white/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(match.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC"
                        })}
                      </span>
                    </div>
 
                    {/* Entry Row */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Team A */}
                      <div className="flex items-center gap-3 w-1/3 min-w-0">
                        <span className="text-2xl sm:text-3xl select-none">{match.teamA.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black truncate text-white">
                            {match.teamA.name}
                          </div>
                          <div className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
                            Elo {Math.round(match.teamA.eloRating)}
                          </div>
                        </div>
                      </div>
 
                      {/* Inputs Box */}
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <Input
                          type="number"
                          min="0"
                          value={scoreA}
                          onChange={(e) =>
                            handleScoreChange(
                              match.teamA.id,
                              match.teamB.id,
                              "A",
                              e.target.value,
                              match.isGroup
                            )
                          }
                          className="w-12 sm:w-14 h-11 text-center text-lg sm:text-xl font-bold bg-zinc-950 border-white/10 focus:border-emerald-500/50 text-white rounded-lg"
                          placeholder="-"
                        />
                        <span className="text-white/20 font-black text-xs">VS</span>
                        <Input
                          type="number"
                          min="0"
                          value={scoreB}
                          onChange={(e) =>
                            handleScoreChange(
                              match.teamA.id,
                              match.teamB.id,
                              "B",
                              e.target.value,
                              match.isGroup
                            )
                          }
                          className="w-12 sm:w-14 h-11 text-center text-lg sm:text-xl font-bold bg-zinc-950 border-white/10 focus:border-emerald-500/50 text-white rounded-lg"
                          placeholder="-"
                        />
                      </div>

                      {/* Team B */}
                      <div className="flex items-center justify-end gap-3 w-1/3 min-w-0 text-right">
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black truncate text-white">
                            {match.teamB.name}
                          </div>
                          <div className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
                            Elo {Math.round(match.teamB.eloRating)}
                          </div>
                        </div>
                        <span className="text-2xl sm:text-3xl select-none">{match.teamB.flag}</span>
                      </div>
                    </div>

                    {/* Footer Row (Toggles & Clear Results) */}
                    {isSet && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                        {/* Penalty Winner Chooser */}
                        {showPenaltyChooser ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              Select Penalty Winner:
                            </span>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePenaltyWinnerChange(
                                    match.teamA.id,
                                    match.teamB.id,
                                    match.teamA.id
                                  )
                                }
                                className={cn(
                                  "h-6 text-[9px] font-bold uppercase px-2 rounded-md",
                                  override.winnerId === match.teamA.id
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                    : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                                )}
                              >
                                {match.teamA.code}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePenaltyWinnerChange(
                                    match.teamA.id,
                                    match.teamB.id,
                                    match.teamB.id
                                  )
                                }
                                className={cn(
                                  "h-6 text-[9px] font-bold uppercase px-2 rounded-md",
                                  override.winnerId === match.teamB.id
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                    : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                                )}
                              >
                                {match.teamB.code}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Winner: {teamsMap[override.winnerId || ""]?.name || "Draw"}
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearResult(match.teamA.id, match.teamB.id)}
                          className="h-6 text-[9px] uppercase tracking-wider font-bold text-white/30 hover:text-red-400 border border-white/5 hover:bg-white/5 self-end sm:self-auto"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Clear Result
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            </div>
          )}
        </div>

        {/* Real-time Standings Sidebar */}
        {activeTab !== "compare" && (
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <Card className="bg-zinc-900/20 backdrop-blur-md border-white/10 overflow-hidden rounded-2xl">
              <CardHeader className="bg-white/5 border-b border-white/5 p-4 sm:p-5">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  Live Standings Impact
                </CardTitle>
                <CardDescription className="text-[11px] text-white/40">
                  Standings dynamically updated based on simulation + your manual overrides.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {result ? (
                  <ScrollArea className="h-[450px]">
                  <div className="p-4 space-y-8">
                    {result &&
                      Object.entries(result.groupStandings).map(([groupId, standings]) => (
                        <div key={groupId} className="space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-1 flex justify-between items-center">
                            <span>Group {groupId}</span>
                            <span className="text-[9px] font-bold text-white/20">GD PTS</span>
                          </div>
                          <div className="space-y-1.5">
                            {standings.slice(0, 4).map((s, idx) => {
                              const team = teamsMap[s.teamId]
                              const advances = idx < 2
                              return (
                                <div
                                  key={s.teamId}
                                  className="flex items-center justify-between text-xs py-1 rounded px-1.5 hover:bg-white/5 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-white/20 w-3 text-[10px] font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="text-base select-none shrink-0">{team?.flag}</span>
                                    <span
                                      className={cn(
                                        "truncate",
                                        advances ? "text-white font-bold" : "text-white/40"
                                      )}
                                    >
                                      {team?.name}
                                    </span>
                                  </div>
                                  <div className="flex gap-3 font-mono text-[11px] shrink-0">
                                    <span className="text-white/30 text-right w-8">
                                      {s.goalDifference > 0 ? "+" : ""}
                                      {s.goalDifference}
                                    </span>
                                    <span
                                      className={cn(
                                        "w-4 text-right font-black",
                                        advances ? "text-emerald-400 text-glow-green" : "text-white/50"
                                      )}
                                    >
                                      {s.points}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
                ) : (
                  <div className="p-6 text-center flex flex-col items-center justify-center min-h-[350px] space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shadow-md">
                      <Activity className="h-5 w-5 text-glow-green" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Standings Inactive
                      </h3>
                      <p className="text-[10px] text-white/40 max-w-[200px] leading-relaxed mx-auto">
                        Live standings impact requires a simulated baseline. Click below to run the calculations.
                      </p>
                    </div>
                    <Button
                      onClick={simulate}
                      disabled={isRunning}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-[10px] h-8 px-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105"
                    >
                      {isRunning ? (
                        <div className="h-3 w-3 border-2 border-white/20 border-t-white animate-spin rounded-full mr-1.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Recalculate Odds
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link href="/bracket" className="block">
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white/60 hover:text-white uppercase text-xs tracking-wider font-bold h-11 rounded-xl group transition-all"
              >
                View Bracket Impact{" "}
                <ChevronRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
