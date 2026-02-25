"use client"

import { useSimulation } from "@/lib/hooks/use-simulation"
import { BracketView } from "@/components/bracket-view"
import { SimulationAnalytics } from "@/components/simulation-analytics"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import teamsData from "@/data/teams.json"
import type { Team, GroupStanding, MatchResult } from "@/lib/simulation"
import { getTeam } from "@/lib/simulation"
import Link from "next/link"
import { Settings2, Trophy, Users } from "lucide-react"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
    teamMap[team.id] = team
}

// ─── Group Table ────────────────────────────────────────────────────

function GroupTable({
    group,
    standings,
    matches,
}: {
    group: string
    standings: GroupStanding[]
    matches: MatchResult[]
}) {
    // Top 2 advance (highlighted)
    return (
        <Card className="bg-card/60 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardHeader className="py-2 px-3 border-b border-white/5 bg-white/5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Group {group}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="border-b border-white/5 text-white/30">
                            <th className="text-left py-1.5 px-2 font-semibold">#</th>
                            <th className="text-left py-1.5 px-2 font-semibold">Team</th>
                            <th className="text-center py-1.5 px-1 font-semibold">P</th>
                            <th className="text-center py-1.5 px-1 font-semibold">W</th>
                            <th className="text-center py-1.5 px-1 font-semibold">D</th>
                            <th className="text-center py-1.5 px-1 font-semibold">L</th>
                            <th className="text-center py-1.5 px-1 font-semibold">GD</th>
                            <th className="text-center py-1.5 px-1 font-semibold">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, idx) => {
                            const team = getTeam(s.teamId)
                            const qualifies = idx < 2
                            return (
                                <tr
                                    key={s.teamId}
                                    className={
                                        qualifies
                                            ? "bg-primary/5 border-l-2 border-l-primary"
                                            : idx < 4
                                                ? "border-l-2 border-l-transparent"
                                                : "border-l-2 border-l-transparent opacity-50"
                                    }
                                >
                                    <td className="py-1 px-2 text-white/40 font-mono">
                                        {idx + 1}
                                    </td>
                                    <td className="py-1 px-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs">{team?.flag}</span>
                                            <span
                                                className={
                                                    qualifies
                                                        ? "font-bold text-primary"
                                                        : "text-white/70"
                                                }
                                            >
                                                {team?.code || s.teamId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-1 px-1 text-center text-white/50 font-mono">
                                        {s.played}
                                    </td>
                                    <td className="py-1 px-1 text-center text-white/50 font-mono">
                                        {s.won}
                                    </td>
                                    <td className="py-1 px-1 text-center text-white/50 font-mono">
                                        {s.drawn}
                                    </td>
                                    <td className="py-1 px-1 text-center text-white/50 font-mono">
                                        {s.lost}
                                    </td>
                                    <td className="py-1 px-1 text-center font-mono">
                                        <span
                                            className={
                                                s.goalDifference > 0
                                                    ? "text-green-400"
                                                    : s.goalDifference < 0
                                                        ? "text-red-400"
                                                        : "text-white/30"
                                            }
                                        >
                                            {s.goalDifference > 0 ? "+" : ""}
                                            {s.goalDifference}
                                        </span>
                                    </td>
                                    <td className="py-1 px-1 text-center font-bold font-mono">
                                        <span
                                            className={
                                                qualifies ? "text-primary" : "text-white/60"
                                            }
                                        >
                                            {s.points}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Group matches */}
                {matches.length > 0 && (
                    <div className="border-t border-white/5 px-2 py-1.5 space-y-0.5">
                        {matches.map((m, i) => {
                            const tA = getTeam(m.teamA)
                            const tB = getTeam(m.teamB)
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-1 text-[10px] text-white/40"
                                >
                                    <span className="flex-1 text-right">
                                        {tA?.code || m.teamA}
                                    </span>
                                    <span className="text-[9px]">{tA?.flag}</span>
                                    <span className="font-mono font-bold text-white/70 px-1">
                                        {m.scoreA} - {m.scoreB}
                                    </span>
                                    <span className="text-[9px]">{tB?.flag}</span>
                                    <span className="flex-1">
                                        {tB?.code || m.teamB}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function BracketPage() {
    const { result, isRunning } = useSimulation()

    const groupKeys = result
        ? Object.keys(result.groupStandings).sort()
        : []

    return (
        <div className="mx-auto max-w-[1600px] px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                        Tournament <span className="text-cyan text-glow-neon">Bracket</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Full tournament path — group standings, knockout bracket, and champion.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/simulate"
                        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        Simulation Lab
                    </Link>
                </div>
            </div>

            {/* Loading spinner */}
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
                            Applying Elo &amp; Poisson Matrix...
                        </span>
                    </div>
                </div>
            )}

            {!isRunning && result && (
                <div className="space-y-10 animate-in fade-in duration-500">
                    {/* ═══ Group Stage ═══ */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                                Group <span className="text-green-500">Stage</span>
                            </h2>
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase border-white/10 text-white/40"
                            >
                                {groupKeys.length} Groups • Top 2 Advance
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupKeys.map((group) => (
                                <GroupTable
                                    key={group}
                                    group={group}
                                    standings={result.groupStandings[group]}
                                    matches={result.groupMatches[group] || []}
                                />
                            ))}
                        </div>
                    </section>

                    {/* ═══ Knockout Bracket ═══ */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                                Knockout <span className="text-cyan text-glow-neon">Bracket</span>
                            </h2>
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase border-white/10 text-white/40"
                            >
                                {result.knockoutBracket.reduce((s, r) => s + r.matches.length, 0)} Matches
                            </Badge>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xl relative overflow-hidden">
                            <BracketView
                                rounds={result.knockoutBracket}
                                teams={teamMap}
                                teamProbabilities={result.teamProbabilities}
                            />
                        </div>
                    </section>

                    {/* ═══ Analytics ═══ */}
                    <section className="pt-4 border-t border-white/5">
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-6">
                            Simulation <span className="text-blue-500 text-glow-blue">Analytics</span>
                        </h2>
                        <SimulationAnalytics />
                    </section>
                </div>
            )}
        </div>
    )
}
