import { notFound } from "next/navigation"
import Link from "next/link"
import teamsData from "@/data/teams.json"
import playersData from "@/data/players.json"
import { TeamKit } from "@/components/team-kit"
import { PlayerCard } from "@/components/player-card"
import { type Team } from "@/lib/simulation"
import { cn } from "@/lib/utils"
import { ChevronLeft, Trophy, Activity, Target, Shield, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PageProps {
    params: { id: string }
}

export function generateStaticParams() {
    return (teamsData as Team[]).map((team) => ({
        id: team.id,
    }))
}

export default async function TeamDetailPage({ params }: PageProps) {
    const { id } = await params
    const team = (teamsData as Team[]).find((t) => t.id === id)

    if (!team) {
        notFound()
    }

    // Cross-reference top players with detailed player data
    const players = team.topPlayers.map((tp) => {
        const detailedPlayer = (playersData as any[]).find(
            (p) => p.name === tp.name && p.nationalTeamCode === team.code
        )
        if (detailedPlayer) return detailedPlayer

        // Fallback if not found in players.json (minimal data to match Player interface)
        return {
            rank: 99,
            name: tp.name,
            nationality: team.name,
            nationalTeamCode: team.code,
            club: tp.club,
            position: tp.position,
            age: tp.age,
            goals2526: 0,
            assists2526: 0,
            competitionWins: [],
            compositeScore: 70
        }
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Breadcrumb / Back Navigation */}
                <Link
                    href="/teams"
                    className="mb-8 flex w-fit items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Teams
                </Link>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left Column: Hero & Kit */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-surface p-8 md:p-12">
                            {/* Background Accent */}
                            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />

                            <div className="relative flex flex-col md:flex-row items-center gap-10">
                                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                    <span className="text-6xl md:text-8xl mb-4 drop-shadow-xl">{team.flag}</span>
                                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground drop-shadow-neon">
                                        {team.name}
                                    </h1>
                                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                        <Badge variant="secondary" className="px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                                            {team.confederation}
                                        </Badge>
                                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-black border-primary/30 text-primary uppercase tracking-widest">
                                            FIFA #{team.fifaRanking}
                                        </Badge>
                                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-black border-gold/30 text-gold uppercase tracking-widest">
                                            ELO {team.eloRating}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex-1 flex justify-center md:justify-end py-4">
                                    <TeamKit teamId={team.id} className="h-64 w-64 md:h-80 md:w-80" />
                                </div>
                            </div>
                        </div>

                        {/* Stats Overview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy className="h-5 w-5 text-gold" />
                                    <h2 className="text-sm font-black uppercase tracking-widest">World Cup Stats</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Appearances</p>
                                        <p className="text-2xl font-black font-mono mt-1">{team.stats.worldCupAppearances}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Best Finish</p>
                                        <p className="text-lg font-bold mt-1 text-gold">{team.stats.bestFinish}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Activity className="h-5 w-5 text-primary" />
                                    <h2 className="text-sm font-black uppercase tracking-widest">Recent Form</h2>
                                </div>
                                <div className="flex gap-2">
                                    {team.stats.recentForm.split("").map((r, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ring-1 ring-inset",
                                                r === "W" && "bg-primary/20 text-primary ring-primary/30 glow-neon-sm",
                                                r === "D" && "bg-gold/20 text-gold ring-gold/30",
                                                r === "L" && "bg-destructive/20 text-destructive ring-destructive/30"
                                            )}>
                                                {r}
                                            </div>
                                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">M{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Simulation Attributes */}
                        <div className="rounded-3xl border border-white/5 bg-surface/50 p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <Target className="h-5 w-5 text-cyan" />
                                <h2 className="text-sm font-black uppercase tracking-widest">Simulation Model Attributes</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attack Strength</span>
                                        <span className="text-xl font-mono font-black text-primary">+{Math.round(team.attackStrength * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full shadow-[0_0_10px_2px_rgba(0,255,135,0.3)]" style={{ width: `${Math.max(20, team.attackStrength * 400)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Defense Strength</span>
                                        <span className="text-xl font-mono font-black text-cyan">{team.defenseStrength > 0 ? "-" : "+"}{Math.abs(Math.round(team.defenseStrength * 100))}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan rounded-full shadow-[0_0_10px_2px_rgba(0,230,255,0.3)]" style={{ width: `${60 - team.defenseStrength * 200}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confidence (Sigma)</span>
                                        <span className="text-xl font-mono font-black text-gold">±{team.eloSigma}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gold rounded-full shadow-[0_0_10px_2px_rgba(255,215,0,0.3)]" style={{ width: `${100 - team.eloSigma}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-start gap-3 rounded-xl bg-primary/5 p-4 border border-primary/10">
                                <Shield className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Simulation Factor</h4>
                                    <p className="text-[10px] leading-relaxed text-muted-foreground mt-1">
                                        These values are recalculated before every match simulation. The <b>Confidence</b> value represents the uncertainty in the team's rating; a lower value means the model is more certain of their potential outcome.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Top Players & Group Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-black uppercase tracking-tight">Top Players</h2>
                                <div className="h-px flex-1 bg-border/50" />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {players.map((player, idx) => (
                                    <PlayerCard key={idx} player={player} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-4">Tournament Path</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Initial Group</span>
                                    <Badge variant="secondary" className="font-black">Group {team.group}</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Key Strategic Rival</span>
                                    <span className="text-xs font-black text-foreground">England (ELO 1910)</span>
                                </div>
                            </div>
                            <Link
                                href="/groups"
                                className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all hover:bg-muted"
                            >
                                View Group Standings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
