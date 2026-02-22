"use client"

import { useSimulation } from "@/lib/hooks/use-simulation"
import { BracketView } from "@/components/bracket-view"
import { SimulationAnalytics } from "@/components/simulation-analytics"
import { SimulationControls } from "@/components/simulation-controls"
import { Badge } from "@/components/ui/badge"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"
import Link from "next/link"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
    teamMap[team.id] = team
}

export default function BracketPage() {
    const { result, isRunning } = useSimulation()

    return (
        <div className="mx-auto max-w-[1600px] px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                        Tournament <span className="text-cyan text-glow-neon">Bracket</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Projected knockout stage based on Monte Carlo simulations. Use the controls to adjust predictions.
                    </p>
                </div>
                <Link
                    href="/"
                    className="rounded-lg border border-border/50 bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
                >
                    Back to Home
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                    {isRunning && (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-20 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                            <div className="relative h-16 w-16">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            </div>
                            <div className="text-center">
                                <span className="text-xl font-black uppercase text-primary tracking-tighter block">
                                    Simulating 10,000 Matches
                                </span>
                                <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
                                    Applying Elo & Poisson Matrix...
                                </span>
                            </div>
                        </div>
                    )}

                    {!isRunning && result && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="outline" className="text-[10px] uppercase border-white/5 opacity-50">Knockout Stage</Badge>
                                </div>
                                <BracketView
                                    rounds={result.knockoutBracket}
                                    teams={teamMap}
                                    teamProbabilities={result.teamProbabilities}
                                />
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
                                    Simulation <span className="text-blue-500 text-glow-blue">Analytics</span>
                                </h2>
                                <SimulationAnalytics />
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 lg:sticky lg:top-8">
                    <SimulationControls />
                </div>
            </div>
        </div>
    )
}
