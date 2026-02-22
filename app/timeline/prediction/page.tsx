"use client"

import React, { useState } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { getTeam, type Team } from "@/lib/simulation"
import { TeamSelector } from "@/components/team-selector"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Users, ArrowRight, CheckCircle2, RotateCcw, Play } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function PredictionPage() {
    const { tournamentState, setStageAnchor, simulate, isRunning, resetConfig } = useSimulation()
    const [activeSlot, setActiveSlot] = useState<{ stage: "semifinals" | "finals" | "champion", index?: number } | null>(null)

    const handleSelectTeam = (teamId: string) => {
        if (!activeSlot) return

        if (activeSlot.stage === "champion") {
            setStageAnchor("champion", teamId)
        } else {
            const current = [...tournamentState.stageAnchors[activeSlot.stage]]
            if (activeSlot.index !== undefined) {
                current[activeSlot.index] = teamId
                setStageAnchor(activeSlot.stage, current)
            }
        }
        setActiveSlot(null)
    }

    const renderSlot = (stage: "semifinals" | "finals" | "champion", index?: number, label?: string) => {
        const teamId = stage === "champion" ? tournamentState.stageAnchors.champion : tournamentState.stageAnchors.semifinals[index!] || tournamentState.stageAnchors.finals[index!]
        const team = teamId ? getTeam(teamId) : null
        const isActive = activeSlot?.stage === stage && activeSlot?.index === index

        return (
            <div
                onClick={() => setActiveSlot({ stage, index })}
                className={cn(
                    "group relative flex items-center gap-4 rounded-xl border p-4 transition-all cursor-pointer",
                    isActive ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                    !team && "border-dashed"
                )}
            >
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 group-hover:scale-110 transition-transform",
                    team ? "text-2xl" : "text-white/20"
                )}>
                    {team ? team.flag : <Users className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</div>
                    <div className={cn("text-lg font-black tracking-tight", team ? "text-white" : "text-white/20 uppercase")}>
                        {team ? team.name : "Select Team"}
                    </div>
                </div>
                {team && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in duration-300" />}
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="space-y-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-2">Pre-Tournament Mode</Badge>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground md:text-6xl">
                        Predict the <span className="text-blue-500 text-glow-blue">Future</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                        Anchor the simulation to your gut feeling. Select who you think will reach the final stages, and let the model calculate probabilities based on your vision.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={resetConfig} className="border-white/10 hover:bg-red-500/10 hover:text-red-400">
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <Link href="/bracket">
                        <Button className="bg-blue-600 hover:bg-blue-500">
                            <Play className="h-4 w-4 mr-2" /> View Bracket
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Prediction Board */}
                <div className="lg:col-span-7 space-y-12">
                    <section className="space-y-6">
                        <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                            <Trophy className="h-6 w-6 text-yellow-400" />
                            The Champions
                        </h2>
                        {renderSlot("champion", undefined, "Winner of FIFA WC 2026")}
                    </section>

                    <section className="space-y-6">
                        <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                            <ArrowRight className="h-6 w-6 text-blue-400" />
                            The Finalists
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {renderSlot("finals", 0, "Finalist 1")}
                            {renderSlot("finals", 1, "Finalist 2")}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                            <Users className="h-6 w-6 text-purple-400" />
                            The Semifinalists
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {renderSlot("semifinals", 0, "Semifinalist 1")}
                            {renderSlot("semifinals", 1, "Semifinalist 2")}
                            {renderSlot("semifinals", 2, "Semifinalist 3")}
                            {renderSlot("semifinals", 3, "Semifinalist 4")}
                        </div>
                    </section>
                </div>

                {/* Team Selection Sidebar */}
                <div className="lg:col-span-5 sticky top-8">
                    <Card className={cn(
                        "bg-card/50 backdrop-blur-md border-white/10 shadow-2xl transition-all",
                        activeSlot ? "opacity-100 translate-x-0" : "opacity-50 pointer-events-none translate-x-4"
                    )}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-400" />
                                Choose Team
                            </CardTitle>
                            <CardDescription>
                                Selecting for {activeSlot?.stage === "champion" ? "Champion" : activeSlot?.stage}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TeamSelector
                                selectedTeamId={null}
                                onSelect={handleSelectTeam}
                            />
                        </CardContent>
                    </Card>

                    {!activeSlot && (
                        <div className="mt-8 p-8 rounded-2xl border-2 border-dashed border-white/5 bg-white/5 text-center">
                            <Trophy className="h-12 w-12 text-white/10 mx-auto mb-4" />
                            <p className="text-sm text-white/40">
                                Select a prediction slot on the left to start building your tournament vision.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={simulate}
                        disabled={isRunning}
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-14 rounded-xl shadow-xl shadow-blue-900/40 uppercase tracking-widest"
                    >
                        {isRunning ? (
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                Recalculating...
                            </div>
                        ) : (
                            "Recalculate Odds"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
