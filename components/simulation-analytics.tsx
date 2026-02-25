"use client";

import React from "react";
import { useSimulation } from "@/lib/hooks/use-simulation";
import { MonochromeBarChart } from "@/components/charts/monochrome-bar-chart";
import { getTeam } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Zap, Target, Activity, Gauge } from "lucide-react";

export function SimulationAnalytics() {
    const { result, isRunning } = useSimulation();

    if (isRunning || !result) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 animate-pulse">
                <div className="h-[350px] flex items-center justify-center text-white/40">
                    Calculating simulation data...
                </div>
            </Card>
        );
    }

    // Get top 10 teams by championship probability
    const chartData = Object.entries(result.teamProbabilities)
        .map(([teamId, probs]) => ({
            label: getTeam(teamId)?.name || teamId,
            value: probs.champion,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const metrics = result.extendedMetrics;

    // Entropy interpretation
    const maxEntropy = Math.log2(Object.keys(result.teamProbabilities).length);
    const entropyPct = maxEntropy > 0 ? Math.round((metrics.tournamentEntropy / maxEntropy) * 100) : 0;
    const entropyLabel = entropyPct > 70 ? "Wide Open" : entropyPct > 40 ? "Competitive" : "Predictable";

    return (
        <div className="space-y-6">
            <MonochromeBarChart
                title="Win Probabilities (Champion)"
                description="Dixon-Coles / Bayesian Elo model · 10,000 Monte Carlo simulations with uncertainty propagation."
                data={chartData}
                configLabel="Champion %"
                unit="%"
            />

            {/* Top 3 Favorites */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {chartData.slice(0, 3).map((team, idx) => (
                    <Card key={team.label} className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                                <Trophy className={idx === 0 ? "text-yellow-400 h-4 w-4" : "text-white/40 h-4 w-4"} />
                                Rank {idx + 1}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-white">{team.label}</div>
                            <div className="text-2xl font-black text-blue-400">{team.value}%</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Extended Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tournament Entropy */}
                <Card className="bg-gradient-to-br from-purple-600/15 to-violet-600/15 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-white/50 flex items-center gap-2">
                            <Gauge className="h-3.5 w-3.5 text-purple-400" />
                            Tournament Entropy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-purple-400">{metrics.tournamentEntropy.toFixed(1)} bits</div>
                        <div className="text-xs text-white/40 mt-1">{entropyLabel} ({entropyPct}% of max)</div>
                        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all"
                                style={{ width: `${entropyPct}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Penalty Shootout Rate */}
                <Card className="bg-gradient-to-br from-amber-600/15 to-orange-600/15 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-white/50 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-amber-400" />
                            Penalty Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-400">{metrics.penaltyShootoutRate}%</div>
                        <div className="text-xs text-white/40 mt-1">of knockout matches go to pens</div>
                    </CardContent>
                </Card>

                {/* Top Upsets */}
                <Card className="bg-gradient-to-br from-rose-600/15 to-pink-600/15 border-white/10 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-white/50 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-rose-400" />
                            Upset Index — Most Likely Shocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {metrics.upsetIndex.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {metrics.upsetIndex.slice(0, 4).map((upset, i) => {
                                    const underdog = getTeam(upset.teamA);
                                    const favorite = getTeam(upset.teamB);
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2 border border-white/5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{underdog?.flag}</span>
                                                <span className="text-xs font-medium text-white">
                                                    {underdog?.name}
                                                </span>
                                                <span className="text-[10px] text-white/30">beats</span>
                                                <span className="text-sm">{favorite?.flag}</span>
                                                <span className="text-xs text-white/60">{favorite?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-rose-400">{upset.upsetProb}%</span>
                                                <span className="text-[9px] text-white/30">Δ{upset.eloGap}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-xs text-white/30">No upsets recorded</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Most Volatile Teams */}
            <Card className="bg-gradient-to-br from-teal-600/10 to-cyan-600/10 border-white/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-white/50 flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-teal-400" />
                        Most Volatile Teams (Highest Elo Uncertainty)
                    </CardTitle>
                    <CardDescription className="text-white/30 text-xs">
                        Teams with fewer historical appearances have wider confidence intervals on their Elo rating.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {metrics.topVolatileTeams.map((t) => {
                            const team = getTeam(t.teamId);
                            return (
                                <div
                                    key={t.teamId}
                                    className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/5"
                                >
                                    <span className="text-sm">{team?.flag}</span>
                                    <span className="text-xs font-medium text-white">{team?.name}</span>
                                    <span className="text-[10px] font-mono text-teal-400">σ={t.sigma}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
