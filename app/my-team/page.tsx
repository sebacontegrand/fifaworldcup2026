"use client"

import { useSimulation } from "@/lib/hooks/use-simulation"
import { useMyTeam } from "@/lib/hooks/use-my-team"
import { TeamCard } from "@/components/team-card"
import { TeamSelector } from "@/components/team-selector"
import { ProbabilityBar } from "@/components/probability-bar"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"
import Link from "next/link"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
    teamMap[team.id] = team
}

export default function MyTeamPage() {
    const { result, isRunning } = useSimulation()
    const { selectedTeam, setSelectedTeam, isLoaded } = useMyTeam()

    if (!isLoaded) return null

    if (!selectedTeam || !teamMap[selectedTeam]) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-foreground">
                    Track Your <span className="text-primary text-glow-neon">Team</span>
                </h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Select a nation to follow their journey, analyze potential knockout paths, and view probability forecasts.
                </p>
                <div className="mx-auto max-w-md text-left rounded-xl border border-border/50 bg-card p-6">
                    <TeamSelector selectedTeamId="" onSelect={setSelectedTeam} />
                </div>
            </div>
        )
    }

    const team = teamMap[selectedTeam]
    const probs = result?.teamProbabilities[selectedTeam]

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Team <span className="text-primary text-glow-neon">Dashboard</span>
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setSelectedTeam("")}
                        className="rounded-lg border border-border/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted"
                    >
                        Change Team
                    </button>
                    <Link
                        href="/"
                        className="rounded-lg border border-border/50 bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
                    >
                        Back
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Team Identity */}
                <div className="md:col-span-1 flex flex-col gap-4">
                    <TeamCard team={team} showGroup={true} rank={undefined} />

                    {isRunning && (
                        <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
                            <div className="h-6 w-6 rounded-full border border-primary border-t-transparent animate-spin" />
                            <span className="text-[10px] font-semibold uppercase text-primary">
                                Simulating tournament...
                            </span>
                        </div>
                    )}
                </div>

                {/* Probabilities */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
                        Tournament Forecast
                    </h2>

                    {!isRunning && probs ? (
                        <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-4">
                            <ProbabilityBar label="Reach Round of 32" value={probs.groupAdvance} color="cyan" />
                            <ProbabilityBar label="Reach Round of 16" value={probs.roundOf16} color="neon" />
                            <ProbabilityBar label="Reach Quarter-Finals" value={probs.quarterFinal} color="neon" />
                            <ProbabilityBar label="Reach Semi-Finals" value={probs.semiFinal} color="neon" />
                            <ProbabilityBar label="Reach Final" value={probs.final} color="gold" />
                            <div className="mt-4 border-t border-border/30 pt-4">
                                <ProbabilityBar label="Win Tournament" value={probs.champion} color="gold" />
                            </div>
                        </div>
                    ) : !isRunning ? (
                        <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
                            Run the simulation to view forecast metrics for {team.name}.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
