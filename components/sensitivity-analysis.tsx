"use client"

import React, { useState, useCallback, useRef } from "react"
import {
    runFullSimulation,
    DEFAULT_CONFIG,
    getTeam,
    type SimulationConfig,
    type SimulationResult,
} from "@/lib/simulation"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    Area,
    AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Loader2, TrendingUp, Zap, Target, Gauge } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface SweepPoint {
    paramValue: number
    topTeamChampion: number
    top5Spread: number
    entropy: number
    penaltyRate: number
    upsetRate: number
    topTeamName: string
}

type SweepVariable = "targetUpsetIndex" | "targetPenaltyRate" | "entropyMultiplier"

interface SweepResult {
    variable: SweepVariable
    label: string
    unit: string
    color: string
    data: SweepPoint[]
}

// ─── Constants ──────────────────────────────────────────────────────

const SWEEP_ITERATIONS = 500

const SWEEP_CONFIGS: {
    variable: SweepVariable
    label: string
    unit: string
    color: string
    min: number
    max: number
    step: number
}[] = [
        {
            variable: "targetUpsetIndex",
            label: "Upset Index",
            unit: "%",
            color: "#f97316",
            min: 10,
            max: 50,
            step: 5,
        },
        {
            variable: "targetPenaltyRate",
            label: "Penalty Rate",
            unit: "%",
            color: "#f59e0b",
            min: 10,
            max: 50,
            step: 5,
        },
        {
            variable: "entropyMultiplier",
            label: "Entropy Multiplier",
            unit: "x",
            color: "#a855f7",
            min: 0.2,
            max: 3.0,
            step: 0.4,
        },
    ]

// ─── Helpers ────────────────────────────────────────────────────────

function extractMetrics(result: SimulationResult): Omit<SweepPoint, "paramValue"> {
    const probs = Object.entries(result.teamProbabilities)
        .map(([id, p]) => ({ id, champion: p.champion }))
        .sort((a, b) => b.champion - a.champion)

    const topTeam = probs[0]
    const top5Sum = probs.slice(0, 5).reduce((s, p) => s + p.champion, 0)

    return {
        topTeamChampion: topTeam.champion,
        top5Spread: Math.round(top5Sum * 10) / 10,
        entropy: result.extendedMetrics.tournamentEntropy,
        penaltyRate: result.extendedMetrics.penaltyShootoutRate,
        upsetRate:
            result.extendedMetrics.upsetIndex.length > 0
                ? Math.round(
                    result.extendedMetrics.upsetIndex.reduce((s, u) => s + u.upsetProb, 0) /
                    result.extendedMetrics.upsetIndex.length *
                    10
                ) / 10
                : 0,
        topTeamName: getTeam(topTeam.id)?.name || topTeam.id,
    }
}

/** Yield to main thread so React can render */
function yieldToMain(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
}

// ─── Icon Components (avoid JSX in const to fix hydration) ─────────

function UpsetIcon() {
    return <Zap className="h-4 w-4" />
}
function PenaltyIcon() {
    return <Target className="h-4 w-4" />
}
function EntropyIcon() {
    return <Gauge className="h-4 w-4" />
}

function getIcon(variable: SweepVariable) {
    switch (variable) {
        case "targetUpsetIndex":
            return <UpsetIcon />
        case "targetPenaltyRate":
            return <PenaltyIcon />
        case "entropyMultiplier":
            return <EntropyIcon />
    }
}

// ─── Component ──────────────────────────────────────────────────────

export function SensitivityAnalysis() {
    const [sweepResults, setSweepResults] = useState<SweepResult[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const cancelRef = useRef(false)

    const runSweep = useCallback(async () => {
        setIsRunning(true)
        setSweepResults([])
        cancelRef.current = false

        // Calculate total points
        const totalSims = SWEEP_CONFIGS.reduce(
            (sum, cfg) => sum + Math.ceil((cfg.max - cfg.min) / cfg.step) + 1,
            0
        )
        setProgress({ current: 0, total: totalSims })

        const allResults: SweepResult[] = []
        let completed = 0

        for (const cfg of SWEEP_CONFIGS) {
            if (cancelRef.current) break

            const data: SweepPoint[] = []

            for (let val = cfg.min; val <= cfg.max + 0.001; val += cfg.step) {
                if (cancelRef.current) break

                const roundedVal = Math.round(val * 100) / 100

                const config: SimulationConfig = {
                    teamSettings: {},
                    globalSettings: {
                        ...DEFAULT_CONFIG.globalSettings,
                        [cfg.variable]: roundedVal,
                    },
                }

                const result = runFullSimulation(config, undefined, SWEEP_ITERATIONS)
                const metrics = extractMetrics(result)

                data.push({ paramValue: roundedVal, ...metrics })

                completed++
                setProgress({ current: completed, total: totalSims })

                // Yield to main thread every point so React can paint progress
                await yieldToMain()
            }

            const sweepResult: SweepResult = {
                variable: cfg.variable,
                label: cfg.label,
                unit: cfg.unit,
                color: cfg.color,
                data,
            }

            allResults.push(sweepResult)
            // Show each sweep chart as soon as it's done
            setSweepResults([...allResults])
            await yieldToMain()
        }

        setIsRunning(false)
    }, [])

    const tooltipStyle = {
        contentStyle: {
            backgroundColor: "oklch(0.15 0.02 260)",
            border: "1px solid oklch(0.25 0.02 260)",
            borderRadius: "10px",
            color: "#fff",
            fontSize: 11,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        },
        itemStyle: { color: "#fff" },
        labelStyle: { color: "#fff", fontWeight: 700 as const, marginBottom: 4 },
    }

    return (
        <div className="space-y-8">
            {/* Run Button */}
            <div className="flex flex-col items-center gap-4">
                <Button
                    onClick={runSweep}
                    disabled={isRunning}
                    size="lg"
                    className="gap-2 font-bold uppercase tracking-wider"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running {progress.current}/{progress.total} simulations...
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4" />
                            Run Sensitivity Analysis
                        </>
                    )}
                </Button>
                {!isRunning && sweepResults.length === 0 && (
                    <p className="text-xs text-muted-foreground max-w-md text-center">
                        Sweeps each variable across its full range using {SWEEP_ITERATIONS} Monte
                        Carlo iterations per sample point. Charts appear progressively as each sweep
                        completes (~15-30 seconds total).
                    </p>
                )}
                {isRunning && (
                    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-cyan transition-all duration-200 rounded-full"
                            style={{
                                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Results — rendered progressively */}
            {sweepResults.map((sweep) => (
                <Card
                    key={sweep.variable}
                    className="bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center justify-center h-8 w-8 rounded-lg"
                                style={{ backgroundColor: `${sweep.color}20` }}
                            >
                                <span style={{ color: sweep.color }}>{getIcon(sweep.variable)}</span>
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-white">
                                    {sweep.label} Sweep
                                </CardTitle>
                                <CardDescription className="text-xs text-white/40">
                                    {sweep.data[0]?.paramValue}
                                    {sweep.unit} → {sweep.data[sweep.data.length - 1]?.paramValue}
                                    {sweep.unit} • {sweep.data.length} points × {SWEEP_ITERATIONS} iterations
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart 1: Championship Concentration */}
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-bold">
                                    Championship Concentration
                                </h4>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sweep.data}>
                                            <defs>
                                                <linearGradient
                                                    id={`grad-${sweep.variable}`}
                                                    x1="0" y1="0" x2="0" y2="1"
                                                >
                                                    <stop offset="5%" stopColor={sweep.color} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={sweep.color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="paramValue"
                                                tick={{ fill: "#fff", fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `${v}${sweep.unit}`}
                                            />
                                            <YAxis
                                                tick={{ fill: "#fff", fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `${v}%`}
                                            />
                                            <Tooltip
                                                {...tooltipStyle}
                                                formatter={(value: number, name: string) => [`${value}%`, name]}
                                                labelFormatter={(v) => `${sweep.label}: ${v}${sweep.unit}`}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 10, color: "#fff" }} />
                                            <Area
                                                type="monotone"
                                                dataKey="topTeamChampion"
                                                name="Top Team %"
                                                stroke={sweep.color}
                                                strokeWidth={2}
                                                fill={`url(#grad-${sweep.variable})`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="top5Spread"
                                                name="Top 5 Combined %"
                                                stroke="#22d3ee"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: "#22d3ee" }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Tournament Dynamics */}
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-bold">
                                    Tournament Dynamics
                                </h4>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={sweep.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="paramValue"
                                                tick={{ fill: "#fff", fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `${v}${sweep.unit}`}
                                            />
                                            <YAxis
                                                tick={{ fill: "#fff", fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                {...tooltipStyle}
                                                labelFormatter={(v) => `${sweep.label}: ${v}${sweep.unit}`}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 10, color: "#fff" }} />
                                            <Line
                                                type="monotone"
                                                dataKey="entropy"
                                                name="Entropy (bits)"
                                                stroke="#a855f7"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: "#a855f7" }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="penaltyRate"
                                                name="Penalty Rate %"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: "#f59e0b" }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="upsetRate"
                                                name="Avg Upset Prob %"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: "#ef4444" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Insight badges */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(() => {
                                const first = sweep.data[0]
                                const last = sweep.data[sweep.data.length - 1]
                                if (!first || !last) return null
                                const champDelta = last.topTeamChampion - first.topTeamChampion
                                const entropyDelta = last.entropy - first.entropy
                                const penaltyDelta = last.penaltyRate - first.penaltyRate

                                return (
                                    <>
                                        <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Top Team: {champDelta > 0 ? "+" : ""}{champDelta.toFixed(1)}%
                                        </Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">
                                            Entropy: {entropyDelta > 0 ? "+" : ""}{entropyDelta.toFixed(2)} bits
                                        </Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">
                                            Penalty Rate: {penaltyDelta > 0 ? "+" : ""}{penaltyDelta.toFixed(1)}%
                                        </Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">
                                            Favorite: {last.topTeamName}
                                        </Badge>
                                    </>
                                )
                            })()}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Cross-variable insight (shows after all 3 complete) */}
            {sweepResults.length === 3 && (
                <Card className="bg-gradient-to-br from-primary/10 to-cyan/10 border-white/10 animate-in fade-in duration-700">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-white">
                            Cross-Variable Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/60 space-y-2">
                        {(() => {
                            const upsetSweep = sweepResults.find((s) => s.variable === "targetUpsetIndex")
                            const entropySweep = sweepResults.find((s) => s.variable === "entropyMultiplier")

                            if (!upsetSweep || !entropySweep) return null

                            const uFirst = upsetSweep.data[0]
                            const uLast = upsetSweep.data[upsetSweep.data.length - 1]
                            const eFirst = entropySweep.data[0]
                            const eLast = entropySweep.data[entropySweep.data.length - 1]

                            return (
                                <>
                                    <p>
                                        <span className="font-semibold text-orange-400">Upset Index</span>{" "}
                                        moved the top team&apos;s win probability from{" "}
                                        <span className="text-white font-mono">{uFirst.topTeamChampion}%</span> →{" "}
                                        <span className="text-white font-mono">{uLast.topTeamChampion}%</span>{" "}
                                        (Δ{(uLast.topTeamChampion - uFirst.topTeamChampion).toFixed(1)}%).
                                    </p>
                                    <p>
                                        <span className="font-semibold text-purple-400">Entropy Multiplier</span>{" "}
                                        shifted tournament entropy by{" "}
                                        <span className="text-white font-mono">
                                            {(eLast.entropy - eFirst.entropy).toFixed(2)} bits
                                        </span>
                                        , making the favorite go from{" "}
                                        <span className="text-white font-mono">{eFirst.topTeamChampion}%</span> →{" "}
                                        <span className="text-white font-mono">{eLast.topTeamChampion}%</span>.
                                    </p>
                                    <p className="text-white/40 italic">
                                        Upset Index and Entropy Multiplier are the strongest interacting variables —
                                        they compound on championship concentration and tournament entropy.
                                    </p>
                                </>
                            )
                        })()}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
