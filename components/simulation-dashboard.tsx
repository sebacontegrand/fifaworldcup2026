"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import {
    runFullSimulation,
    getTeam,
    type Team,
    type TacticalStyle,
    type SimulationResult,
} from "@/lib/simulation"
import teamsData from "@/data/teams.json"
import { TeamSelector } from "@/components/team-selector"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts"
import Link from "next/link"
import {
    Zap,
    Target,
    Gauge,
    Globe,
    ChevronDown,
    ChevronUp,
    Play,
    Loader2,
    RotateCcw,
    ArrowRight,
    Users,
    Trophy,
    Shield,
    Swords,
    Info,
} from "lucide-react"

const allTeams = teamsData as Team[]

// ─── Collapsible Explanation ────────────────────────────────────────

function Explanation({
    children,
    defaultOpen = false,
}: {
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-white/50 transition-colors"
            >
                <Info className="h-3 w-3" />
                How it works
                {open ? (
                    <ChevronUp className="h-3 w-3" />
                ) : (
                    <ChevronDown className="h-3 w-3" />
                )}
            </button>
            {open && (
                <p className="mt-2 text-xs text-white/50 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {children}
                </p>
            )}
        </div>
    )
}

// ─── Global Variable Slider ────────────────────────────────────────

function VariableSlider({
    icon,
    label,
    value,
    min,
    max,
    step,
    unit,
    leftLabel,
    rightLabel,
    color,
    explanation,
    onChange,
}: {
    icon: React.ReactNode
    label: string
    value: number
    min: number
    max: number
    step: number
    unit: string
    leftLabel: string
    rightLabel: string
    color: string
    explanation: string
    onChange: (v: number) => void
}) {
    const display =
        unit === "x" ? `${value.toFixed(1)}${unit}` : `${value}${unit}`

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                    <span style={{ color }}>{icon}</span>
                    {label}
                </Label>
                <span
                    className="text-sm font-bold font-mono tabular-nums"
                    style={{ color }}
                >
                    {display}
                </span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={([v]) => onChange(v)}
            />
            <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
            <Explanation>{explanation}</Explanation>
        </div>
    )
}

// ─── Top 10 Preview Chart ──────────────────────────────────────────

function Top10Preview({
    previewResult,
    isPreviewRunning,
}: {
    previewResult: SimulationResult | null
    isPreviewRunning: boolean
}) {
    if (isPreviewRunning) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-white/40">Computing preview…</span>
            </div>
        )
    }

    if (!previewResult) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-white/20">
                <Trophy className="h-8 w-8" />
                <span className="text-xs">Adjust any variable to see a live preview</span>
            </div>
        )
    }

    const top10 = Object.entries(previewResult.teamProbabilities)
        .sort(([, a], [, b]) => b.champion - a.champion)
        .slice(0, 10)
        .map(([id, prob]) => {
            const team = getTeam(id)
            return {
                name: team?.code || id,
                flag: team?.flag || "",
                value: prob.champion,
            }
        })

    const colors = [
        "#facc15", // gold
        "#22d3ee",
        "#22d3ee",
        "#a78bfa",
        "#a78bfa",
        "#64748b",
        "#64748b",
        "#64748b",
        "#64748b",
        "#64748b",
    ]

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} layout="vertical" barCategoryGap="20%">
                    <XAxis
                        type="number"
                        tick={{ fill: "#fff", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#fff", fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "oklch(0.15 0.02 260)",
                            border: "1px solid oklch(0.25 0.02 260)",
                            borderRadius: "10px",
                            color: "#fff",
                            fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value}%`, "Win Probability"]}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {top10.map((_, i) => (
                            <Cell key={i} fill={colors[i] || "#64748b"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// ─── Main Dashboard ────────────────────────────────────────────────

const PREVIEW_ITERATIONS = 500
const PREVIEW_DEBOUNCE_MS = 400

export function SimulationDashboard() {
    const {
        config,
        updateTeamConfig,
        updateGlobalConfig,
        resetConfig,
        simulate,
        isRunning,
        result,
    } = useSimulation()

    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [previewResult, setPreviewResult] = useState<SimulationResult | null>(null)
    const [isPreviewRunning, setIsPreviewRunning] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const configRef = useRef(config)
    configRef.current = config

    // Run a fast preview whenever config changes
    const runPreview = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setIsPreviewRunning(true)
            // Yield to let the spinner render
            await new Promise((r) => setTimeout(r, 10))
            const res = runFullSimulation(configRef.current, undefined, PREVIEW_ITERATIONS)
            setPreviewResult(res)
            setIsPreviewRunning(false)
        }, PREVIEW_DEBOUNCE_MS)
    }, [])

    // Trigger preview on mount and whenever config changes
    useEffect(() => {
        runPreview()
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [config, runPreview])

    const selectedTeam = selectedTeamId ? getTeam(selectedTeamId) : null
    const teamSettings = selectedTeamId
        ? config.teamSettings[selectedTeamId] || {
            eloAdjustment: 0,
            injuredPlayers: [],
            tacticalStyle: "Normal" as TacticalStyle,
            isHostOverride: null,
        }
        : null

    return (
        <div className="space-y-6">
            {/* ═══ Card 1: Global Variables ═══ */}
            <Card className="bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                <Globe className="h-5 w-5 text-blue-400" />
                                Global Variables
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                These parameters affect every match in the tournament
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetConfig}
                            className="gap-1.5 border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/30"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                    <VariableSlider
                        icon={<Zap className="h-4 w-4" />}
                        label="Target Upset Index"
                        value={config.globalSettings.targetUpsetIndex}
                        min={10}
                        max={50}
                        step={1}
                        unit="%"
                        leftLabel="FAVORITES WIN"
                        rightLabel="UPSETS LIKELY"
                        color="#f97316"
                        explanation="Compresses all team Elo ratings toward the league average. Higher values flatten the gap between strong and weak teams, making upsets more frequent. At 15% (default), favourites dominate. At 50%, even lower-ranked teams have a realistic shot. Capped at 35% compression so the best teams always retain some edge."
                        onChange={(v) => updateGlobalConfig({ targetUpsetIndex: v })}
                    />

                    <VariableSlider
                        icon={<Target className="h-4 w-4" />}
                        label="Target Penalty Rate"
                        value={config.globalSettings.targetPenaltyRate}
                        min={10}
                        max={50}
                        step={1}
                        unit="%"
                        leftLabel="RARE"
                        rightLabel="FREQUENT"
                        color="#f59e0b"
                        explanation="Controls how likely knockout matches are to end in a penalty shootout. Works by scaling down the expected goals during extra time — a higher value makes ET almost scoreless, forcing penalties. Only affects knockout rounds (groups always allow draws). Real World Cups typically see ~20-25% of knockout matches going to penalties."
                        onChange={(v) => updateGlobalConfig({ targetPenaltyRate: v })}
                    />

                    <VariableSlider
                        icon={<Gauge className="h-4 w-4" />}
                        label="Tournament Entropy"
                        value={config.globalSettings.entropyMultiplier}
                        min={0.1}
                        max={3.0}
                        step={0.1}
                        unit="x"
                        leftLabel="PREDICTABLE"
                        rightLabel="WILD"
                        color="#a855f7"
                        explanation="Scales the Bayesian Elo uncertainty (σ) for every team. At 1.0x, the standard uncertainty applies. Higher values widen the distribution each team's Elo is sampled from per iteration, increasing the variance in outcomes. Dampened by a square-root curve (3.0x slider → 1.73x effective σ). Only active when 'Propagate Uncertainty' is enabled."
                        onChange={(v) => updateGlobalConfig({ entropyMultiplier: v })}
                    />

                    <VariableSlider
                        icon={<Globe className="h-4 w-4" />}
                        label="Home Advantage"
                        value={config.globalSettings.homeAdvantageStrength}
                        min={0}
                        max={150}
                        step={10}
                        unit=" Elo"
                        leftLabel="NO ADVANTAGE"
                        rightLabel="FORTRESS"
                        color="#6366f1"
                        explanation="Adds Elo points to host nations (USA, Mexico, Canada) when calculating expected goals. 80 Elo points (default) is roughly equivalent to a 60% win probability boost. This historically models the ~65% home win rate in World Cup matches."
                        onChange={(v) => updateGlobalConfig({ homeAdvantageStrength: v })}
                    />

                    {/* Uncertainty toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2 text-purple-300 text-sm">
                                <Zap className="h-4 w-4" />
                                Propagate Elo Uncertainty
                            </Label>
                            <p className="text-[10px] text-purple-300/60">
                                Sample each team&apos;s Elo from a Bayesian distribution (μ ± σ) every
                                MC iteration. If OFF, the Entropy slider has no effect.
                            </p>
                        </div>
                        <Switch
                            checked={config.globalSettings.propagateUncertainty}
                            onCheckedChange={(val) =>
                                updateGlobalConfig({ propagateUncertainty: val })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ═══ Card 2: Team Spotlight ═══ */}
            <Card className="bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <Users className="h-5 w-5 text-cyan-400" />
                        Team Spotlight
                    </CardTitle>
                    <CardDescription className="text-white/40">
                        Customize individual team parameters and see how they affect the top 10
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: team controls */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Select Team
                                </Label>
                                <TeamSelector
                                    selectedTeamId={selectedTeamId}
                                    onSelect={setSelectedTeamId}
                                />
                            </div>

                            {selectedTeam && teamSettings && (
                                <div className="space-y-5 p-4 rounded-xl bg-white/5 border border-white/10">
                                    {/* Team header */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{selectedTeam.flag}</span>
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {selectedTeam.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] border-white/10 text-white/50"
                                                >
                                                    Elo {selectedTeam.eloRating}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] border-white/10 text-white/50"
                                                >
                                                    Group {selectedTeam.group}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] border-white/10 text-white/50"
                                                >
                                                    σ = {selectedTeam.eloSigma ?? 50}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Elo Adjustment */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2 text-sm">
                                                <Trophy className="h-4 w-4 text-yellow-400" />
                                                Elo Adjustment
                                            </Label>
                                            <span className="text-sm font-mono font-bold text-yellow-400">
                                                {teamSettings.eloAdjustment > 0 ? "+" : ""}
                                                {teamSettings.eloAdjustment}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[teamSettings.eloAdjustment]}
                                            min={-200}
                                            max={200}
                                            step={10}
                                            onValueChange={([v]) =>
                                                updateTeamConfig(selectedTeamId!, {
                                                    eloAdjustment: v,
                                                })
                                            }
                                        />
                                        <div className="flex justify-between text-[10px] text-white/30 font-mono">
                                            <span>−200</span>
                                            <span>0</span>
                                            <span>+200</span>
                                        </div>
                                        <Explanation>
                                            Manually adjust this team&apos;s Elo rating. Use this
                                            to model recent form changes, key player transfers, or
                                            personal predictions. +100 Elo ≈ +15% win probability
                                            against an equal opponent.
                                        </Explanation>
                                    </div>

                                    {/* Tactical Style */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm">
                                            <Swords className="h-4 w-4 text-green-400" />
                                            Tactical Style
                                        </Label>
                                        <Select
                                            value={teamSettings.tacticalStyle}
                                            onValueChange={(v) =>
                                                updateTeamConfig(selectedTeamId!, {
                                                    tacticalStyle: v as TacticalStyle,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Attacking">
                                                    ⚔️ Attacking — High risk, high reward
                                                </SelectItem>
                                                <SelectItem value="Normal">
                                                    ⚖️ Balanced — Default style
                                                </SelectItem>
                                                <SelectItem value="Defensive">
                                                    🛡️ Defensive — Low scoring, solid defense
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Explanation>
                                            Overrides the Nash equilibrium tactical calculation.
                                            Attacking boosts goal output but weakens defense.
                                            Defensive reduces goals conceded but lowers scoring.
                                            These modify the Dixon-Coles λ values.
                                        </Explanation>
                                    </div>

                                    {/* Host Override */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                        <div className="space-y-0.5">
                                            <Label className="flex items-center gap-2 text-indigo-300 text-sm">
                                                <Shield className="h-4 w-4" />
                                                Home Team Override
                                            </Label>
                                            <p className="text-[10px] text-indigo-300/60">
                                                Force this team to receive the home advantage bonus
                                            </p>
                                        </div>
                                        <Switch
                                            checked={teamSettings.isHostOverride === true}
                                            onCheckedChange={(val) =>
                                                updateTeamConfig(selectedTeamId!, {
                                                    isHostOverride: val ? true : null,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {!selectedTeam && (
                                <div className="flex flex-col items-center justify-center h-40 rounded-xl bg-white/5 border border-white/10 text-white/20 gap-2">
                                    <Users className="h-6 w-6" />
                                    <span className="text-xs">Select a team above to customize</span>
                                </div>
                            )}
                        </div>

                        {/* Right: live top-10 preview */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Live Top 10 Preview
                                </h4>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] border-white/10 text-white/30"
                                >
                                    {PREVIEW_ITERATIONS} iterations
                                </Badge>
                            </div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <Top10Preview
                                    previewResult={previewResult}
                                    isPreviewRunning={isPreviewRunning}
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-white/30 text-center">
                                Fast preview updates automatically when you change any setting
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ═══ Card 3: Run Full Simulation ═══ */}
            <Card className="bg-gradient-to-br from-primary/10 to-cyan/5 border-white/10 overflow-hidden">
                <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
                            Ready to commit?
                        </h3>
                        <Button
                            onClick={simulate}
                            disabled={isRunning}
                            size="lg"
                            className="gap-2 font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 px-8 py-6 text-base"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Running 10,000 iterations…
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5 fill-current" />
                                    Run Full Simulation
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-white/40 max-w-sm text-center">
                            Runs 10,000 Monte Carlo tournament iterations with your current
                            settings. Results will be available across all pages.
                        </p>

                        {result && !isRunning && (
                            <div className="mt-4 flex flex-col items-center gap-3">
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    ✓ Simulation complete
                                </Badge>
                                <Link
                                    href="/bracket"
                                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    View results in Bracket
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
