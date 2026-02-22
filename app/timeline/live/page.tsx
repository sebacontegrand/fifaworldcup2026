"use client"

import React, { useState } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { getTeamsByGroup, type Team, type MatchResult, type GroupStanding } from "@/lib/simulation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Save, RotateCcw, Play, CheckCircle2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LiveResultsPage() {
    const { tournamentState, updateMatchResult, simulate, isRunning, resetConfig, result } = useSimulation()
    const groups = getTeamsByGroup()

    const handleScoreChange = (teamAId: string, teamBId: string, side: 'A' | 'B', value: string) => {
        const scoreValue = parseInt(value)
        if (isNaN(scoreValue)) return

        const key = `${teamAId}_${teamBId}`
        const current = tournamentState.matchOverrides[key] || { scoreA: 0, scoreB: 0 }

        updateMatchResult(teamAId, teamBId, {
            ...current,
            scoreA: side === 'A' ? scoreValue : current.scoreA,
            scoreB: side === 'B' ? scoreValue : current.scoreB,
        })
    }

    const handleClearResult = (teamAId: string, teamBId: string) => {
        updateMatchResult(teamAId, teamBId, null)
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="space-y-2">
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 mb-2">Live Tournament Mode</Badge>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground md:text-6xl">
                        Live <span className="text-green-500 text-glow-green">Results</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                        Update match results as they happen. The simulation will instantly adapt to the new reality, recalculating every team's path to the trophy.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={resetConfig} className="border-white/10 hover:bg-red-500/10 hover:text-red-400">
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset All
                    </Button>
                    <Button
                        onClick={simulate}
                        disabled={isRunning}
                        className="bg-green-600 hover:bg-green-500"
                    >
                        {isRunning ? <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        Recalculate Odds
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Match Entry Area */}
                <div className="lg:col-span-8 space-y-8">
                    <Tabs defaultValue="A" className="w-full">
                        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
                            {Object.keys(groups).map(groupId => (
                                <TabsTrigger key={groupId} value={groupId} className="data-[state=active]:bg-zinc-800">
                                    Group {groupId}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.entries(groups).map(([groupId, groupTeams]) => (
                            <TabsContent key={groupId} value={groupId} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Simple round robin match generator for display matches */}
                                    {(groupTeams as Team[]).map((teamA, i) =>
                                        (groupTeams as Team[]).slice(i + 1).map(teamB => {
                                            const key = `${teamA.id}_${teamB.id}`
                                            const override = tournamentState.matchOverrides[key]
                                            const isSet = !!override

                                            return (
                                                <div key={key} className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                    isSet ? "bg-green-500/5 border-green-500/30" : "bg-card border-white/5 hover:border-white/10"
                                                )}>
                                                    <div className="flex items-center gap-3 w-[150px]">
                                                        <span className="text-xl">{teamA.flag}</span>
                                                        <span className="text-sm font-bold truncate">{teamA.name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={override?.scoreA ?? ""}
                                                            onChange={(e) => handleScoreChange(teamA.id, teamB.id, 'A', e.target.value)}
                                                            className="w-14 h-12 text-center text-xl font-bold bg-zinc-900 border-white/10"
                                                            placeholder="-"
                                                        />
                                                        <span className="text-white/20 font-black">VS</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={override?.scoreB ?? ""}
                                                            onChange={(e) => handleScoreChange(teamA.id, teamB.id, 'B', e.target.value)}
                                                            className="w-14 h-12 text-center text-xl font-bold bg-zinc-900 border-white/10"
                                                            placeholder="-"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-end gap-3 w-[150px]">
                                                        <span className="text-sm font-bold truncate text-right">{teamB.name}</span>
                                                        <span className="text-xl">{teamB.flag}</span>
                                                        {isSet && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleClearResult(teamA.id, teamB.id)}
                                                                className="h-6 w-6 text-white/20 hover:text-red-400"
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* Real-time Impact Sidebar */}
                <div className="lg:col-span-4 space-y-6 sticky top-8">
                    <Card className="bg-card/50 backdrop-blur-md border-white/10 overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-400" />
                                Live Group Standings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px]">
                                <div className="p-4 space-y-8">
                                    {result && Object.entries(result.groupStandings).map(([groupId, standings]) => (
                                        <div key={groupId} className="space-y-4">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-1">Group {groupId}</div>
                                            <div className="space-y-2">
                                                {standings.slice(0, 4).map((s, idx) => {
                                                    const team = groupTeamsMap[s.teamId]
                                                    return (
                                                        <div key={s.teamId} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/20 w-3">{idx + 1}</span>
                                                                <span>{team?.flag}</span>
                                                                <span className={cn(idx < 2 ? "text-white font-medium" : "text-white/40")}>{team?.name}</span>
                                                            </div>
                                                            <div className="flex gap-3 font-mono">
                                                                <span className="text-white/40">{s.goalDifference > 0 ? "+" : ""}{s.goalDifference}</span>
                                                                <span className="text-white font-bold w-4 text-right">{s.points}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Link href="/bracket" className="block">
                        <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white/60 hover:text-white group">
                            View Impacted Bracket <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Helper to get team info for the standings
import teamsData from "@/data/teams.json"
const groupTeamsMap: Record<string, Team> = {}
for (const team of teamsData as Team[]) {
    groupTeamsMap[team.id] = team
}
