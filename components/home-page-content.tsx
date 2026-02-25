"use client"

import { useSimulation } from "@/lib/hooks/use-simulation"
import { useMyTeam } from "@/lib/hooks/use-my-team"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"
import { TeamCard } from "@/components/team-card"
import { TeamSelector } from "@/components/team-selector"
import { ProbabilityBar } from "@/components/probability-bar"
import Link from "next/link"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
    teamMap[team.id] = team
}

export function HomePageContent() {
    const { result, isRunning } = useSimulation()
    const { selectedTeam, setSelectedTeam, isLoaded } = useMyTeam()

    // Top 10 favorites sorted by champion probability
    const topFavorites = result
        ? Object.entries(result.teamProbabilities)
            .sort(([, a], [, b]) => b.champion - a.champion)
            .slice(0, 10)
            .map(([id, prob]) => ({ team: teamMap[id], probability: prob }))
        : []

    const chartData = topFavorites.map(({ team, probability }) => ({
        name: team?.code || "",
        flag: team?.flag || "",
        value: probability.champion,
    }))

    return (
        <>
            {/* Hero Section */}
            <section className="mb-12 flex flex-col items-center text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-neon" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Simulation Active
                    </span>
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl text-balance">
                    FIFA World Cup
                    <span className="block text-glow-neon text-primary">2026</span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Advanced predictions powered by{" "}
                    <span className="font-semibold text-foreground">Dixon-Coles bivariate Poisson</span>{" "}
                    and <span className="font-semibold text-foreground">Bayesian Elo</span> uncertainty
                    propagation across 10,000 Monte Carlo iterations. Explore mixed-strategy Nash
                    equilibria, control tournament chaos, and discover the most likely path to glory.
                </p>

                <div className="mt-6 flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black font-mono text-primary">
                            {allTeams.length}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Teams
                        </span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black font-mono text-gold">12</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Groups
                        </span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black font-mono text-cyan">104</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Matches
                        </span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black font-mono text-foreground">
                            10K
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Simulations
                        </span>
                    </div>
                </div>
            </section>

            {/* Loading State */}
            {isRunning && (
                <div className="mb-8 flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-8">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold text-primary">
                        Running 10,000 Monte Carlo simulations...
                    </span>
                </div>
            )}

            {result && (
                <>
                    {/* Top Favorites Chart */}
                    <section className="mb-12">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
                                Tournament Favorites
                            </h2>
                            <Link
                                href="/bracket"
                                className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                            >
                                View Bracket
                            </Link>
                        </div>

                        <div className="rounded-xl border border-border/50 bg-card p-4">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barCategoryGap="15%">
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#ffffff",
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#ffffff", fontSize: 10 }}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "oklch(0.17 0.02 260)",
                                                border: "1px solid oklch(0.28 0.02 260)",
                                                borderRadius: "8px",
                                                color: "#ffffff",
                                                fontSize: 12,
                                            }}
                                            itemStyle={{ color: "#ffffff" }}
                                            labelStyle={{ color: "#ffffff" }}
                                            formatter={(value: number) => [
                                                `${value}%`,
                                                "Win Probability",
                                            ]}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {chartData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        index === 0
                                                            ? "oklch(0.87 0.17 85)"
                                                            : index < 3
                                                                ? "oklch(0.85 0.22 155)"
                                                                : "oklch(0.78 0.15 200)"
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* Top 5 Team Cards */}
                    <section className="mb-12">
                        <h2 className="mb-4 text-lg font-bold uppercase tracking-wider text-foreground">
                            Top 5 Contenders
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {topFavorites.slice(0, 5).map(({ team, probability }, i) =>
                                team ? (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        probability={probability.champion}
                                        rank={i + 1}
                                    />
                                ) : null
                            )}
                        </div>
                    </section>

                    {/* Group of Death Analysis */}
                    <section className="mb-12">
                        <h2 className="mb-4 text-lg font-bold uppercase tracking-wider text-foreground">
                            Group of Death
                        </h2>
                        <GroupOfDeathCard result={result} />
                    </section>
                </>
            )}

            {/* Pick Your Team */}
            <section className="mb-12">
                <div className="rounded-xl border border-border/50 bg-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
                                Pick Your Team
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Select a team to follow through the tournament
                            </p>
                        </div>
                        {isLoaded && selectedTeam && teamMap[selectedTeam] && (
                            <Link
                                href="/my-team"
                                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90"
                            >
                                <span>{teamMap[selectedTeam].flag}</span>
                                Track {teamMap[selectedTeam].code}
                            </Link>
                        )}
                    </div>
                    <TeamSelector
                        selectedTeamId={selectedTeam}
                        onSelect={setSelectedTeam}
                    />
                </div>
            </section>

            {/* Quick Links */}
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    {
                        href: "/groups",
                        label: "Groups",
                        desc: "12 groups, 42 teams",
                        color: "text-primary",
                    },
                    {
                        href: "/bracket",
                        label: "Bracket",
                        desc: "Full tournament tree",
                        color: "text-cyan",
                    },
                    {
                        href: "/players",
                        label: "Players",
                        desc: "Top 60 ranked",
                        color: "text-gold",
                    },
                    {
                        href: "/my-team",
                        label: "My Team",
                        desc: "Track your pick",
                        color: "text-foreground",
                    },
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                    >
                        <span
                            className={`text-sm font-bold uppercase tracking-wider ${link.color}`}
                        >
                            {link.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{link.desc}</span>
                    </Link>
                ))}
            </section>

            {/* Methodology */}
            <section className="mt-12 rounded-xl border border-border/50 bg-card p-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
                    Methodology & Sources
                </h2>
                <div className="grid grid-cols-1 gap-4 text-xs leading-relaxed text-muted-foreground md:grid-cols-2">
                    <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                            Dixon-Coles / Bayesian Elo Model
                        </h3>
                        <p>
                            Goal predictions use the Dixon-Coles bivariate Poisson model, which
                            splits each team into per-team attack and defense strength parameters
                            (λ<sub>home</sub> = exp(μ + attack − defense + home_adv)). A ρ correction
                            adjusts low-scoring outcome probabilities (0-0, 1-0, 0-1, 1-1). Elo
                            ratings are treated as Bayesian distributions (μ ± σ), sampled fresh
                            each Monte Carlo iteration to propagate uncertainty.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                            Monte Carlo Simulation
                        </h3>
                        <p>
                            10,000 full tournament iterations (group stage → Round of 32 → Final)
                            produce probability distributions for advancement, championship, and
                            elimination at each stage. Extended analytics include tournament
                            entropy (bits), penalty shootout likelihood, upset index, and team
                            volatility rankings based on Bayesian Elo variance.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                            Game Theory — Mixed-Strategy Equilibria
                        </h3>
                        <p>
                            Nash Equilibrium analysis with 3×3 payoff matrices (attacking,
                            balanced, defensive) now includes mixed-strategy equilibria via
                            iterated softmax best-response. Context-aware utility functions
                            differentiate group stage (draw = 1 pt) from knockout (draw ≈ coin
                            flip) and adjust for scoreline urgency and match minute.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                            Data Sources
                        </h3>
                        <p>
                            FIFA/Coca-Cola World Rankings (Feb 2026), official FIFA World Cup 2026
                            group draw (Dec 2025), club-level xG and defensive metrics from
                            2024-25 and 2025-26 European league seasons (Opta/FBref), historical
                            World Cup match data (1930–2022), and EloRatings.net international
                            football Elo database.
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}

// ─── Group of Death sub-component ────────────────────────────────────

function GroupOfDeathCard({
    result,
}: {
    result: NonNullable<ReturnType<typeof useSimulation>["result"]>
}) {
    // Find the group with highest average Elo
    const groups: Record<string, Team[]> = {}
    for (const team of allTeams) {
        if (!groups[team.group]) groups[team.group] = []
        groups[team.group].push(team)
    }

    let deathGroup = "A"
    let maxAvgElo = 0
    for (const [g, teams] of Object.entries(groups)) {
        const avgElo = teams.reduce((s, t) => s + t.eloRating, 0) / teams.length
        if (avgElo > maxAvgElo) {
            maxAvgElo = avgElo
            deathGroup = g
        }
    }

    const deathTeams = groups[deathGroup] || []

    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-destructive/20 px-2 py-1 text-xs font-bold uppercase text-destructive">
                    Group {deathGroup}
                </span>
                <span className="text-xs text-muted-foreground">
                    Avg Elo: {Math.round(maxAvgElo)}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {deathTeams.map((team) => (
                    <div key={team.id} className="flex flex-col gap-2">
                        <TeamCard team={team} compact showGroup={false} />
                        {result.teamProbabilities[team.id] && (
                            <ProbabilityBar
                                label="Advance"
                                value={result.teamProbabilities[team.id].groupAdvance}
                                color="neon"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
