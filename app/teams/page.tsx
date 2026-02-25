import teamsData from "@/data/teams.json"
import { TeamCard } from "@/components/team-card"
import { type Team } from "@/lib/simulation"
import { Badge } from "@/components/ui/badge"

export default function TeamsPage() {
    const teams = teamsData as Team[]

    // Group teams by confederation
    const confederations = Array.from(new Set(teams.map(t => t.confederation))).sort()

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl bg-gradient-to-r from-primary via-cyan to-gold bg-clip-text text-transparent">
                    Competing Nations
                </h1>
                <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    The 48 nations competing for glory in the FIFA World Cup 2026.
                    View team profiles, key players, and statistical strength.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {confederations.map(conf => (
                        <Badge key={conf} variant="secondary" className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold border border-white/5">
                            {conf}
                        </Badge>
                    ))}
                    <Badge variant="outline" className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold border-primary/30 text-primary">
                        48 Teams
                    </Badge>
                </div>
            </div>

            <div className="space-y-16">
                {confederations.map(confederation => {
                    const confTeams = teams
                        .filter(t => t.confederation === confederation)
                        .sort((a, b) => a.name.localeCompare(b.name))

                    return (
                        <div key={confederation} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
                                    {confederation}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                <Badge variant="outline" className="text-[10px] uppercase border-white/10 text-white/40">
                                    {confTeams.length} Teams
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {confTeams.map(team => (
                                    <TeamCard key={team.id} team={team} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Stats Summary Footer */}
            <div className="mt-20 rounded-2xl border border-white/5 bg-surface/50 p-8 text-center backdrop-blur-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-2xl font-black text-primary">48</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Nations</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-cyan">6</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Confederations</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gold">144</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Star Players</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">12</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Groups</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
