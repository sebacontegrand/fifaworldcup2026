"use client";

import React from "react";
import { useSimulation } from "@/lib/hooks/use-simulation";
import { MonochromeBarChart } from "@/components/charts/monochrome-bar-chart";
import { getTeam } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

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

    return (
        <div className="space-y-6">
            <MonochromeBarChart
                title="Win Probabilities (Champion)"
                description="Probability of winning the FIFA World Cup 2026 based on 10,000 simulations."
                data={chartData}
                configLabel="Champion %"
                unit="%"
            />

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
        </div>
    );
}
