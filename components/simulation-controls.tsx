"use client"

import React, { useState } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { getTeam, type TacticalStyle } from "@/lib/simulation"
import { TeamSelector } from "@/components/team-selector"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Settings2, Users, Target, Globe, Zap, RotateCcw, Play, Gauge } from "lucide-react"

export function SimulationControls() {
    const { config, updateTeamConfig, updateGlobalConfig, resetConfig, simulate, isRunning } = useSimulation()
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

    const selectedTeam = selectedTeamId ? getTeam(selectedTeamId) : null
    const teamSettings = selectedTeamId ? config.teamSettings[selectedTeamId] || {
        eloAdjustment: 0,
        injuredPlayers: [],
        tacticalStyle: "Normal",
        isHostOverride: null
    } : null

    return (
        <Card className="bg-card/50 backdrop-blur-md border-white/10 shadow-2xl overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-blue-400" />
                            Sim Controls
                        </CardTitle>
                        <CardDescription className="text-white/60">Modify tournament variables</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={resetConfig}
                            className="hover:bg-red-500/10 hover:text-red-400 border-white/10"
                            title="Reset all settings"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={simulate}
                            disabled={isRunning}
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40"
                        >
                            {isRunning ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : (
                                <Play className="h-4 w-4 mr-2 fill-current" />
                            )}
                            {isRunning ? "Simulating..." : "Run Simulation"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <Tabs defaultValue="team" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-white/5 bg-transparent p-0">
                    <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white/5 py-3">Team Settings</TabsTrigger>
                    <TabsTrigger value="global" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white/5 py-3">Global Variables</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <TabsContent value="team" className="p-4 m-0 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-white/40">Select Team to Edit</Label>
                            <TeamSelector
                                selectedTeamId={selectedTeamId}
                                onSelect={setSelectedTeamId}
                            />
                        </div>

                        {selectedTeam && teamSettings && (
                            <div className="pt-6 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{selectedTeam.flag}</span>
                                    <div>
                                        <h3 className="font-bold text-white">{selectedTeam.name}</h3>
                                        <Badge variant="outline" className="text-[10px] uppercase border-white/10">Group {selectedTeam.group}</Badge>
                                    </div>
                                </div>

                                {/* 1. Elo Hype Slider */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-yellow-400" />
                                            Elo Hype Adjustment
                                        </Label>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            teamSettings.eloAdjustment > 0 ? "text-green-400" : teamSettings.eloAdjustment < 0 ? "text-red-400" : "text-white/40"
                                        )}>
                                            {teamSettings.eloAdjustment > 0 ? "+" : ""}{teamSettings.eloAdjustment}
                                        </span>
                                    </div>
                                    <Slider
                                        value={[teamSettings.eloAdjustment]}
                                        min={-200}
                                        max={200}
                                        step={10}
                                        onValueChange={([val]) => updateTeamConfig(selectedTeam.id, { eloAdjustment: val })}
                                    />
                                    <p className="text-[10px] text-white/40 italic">Directly influences basic win probability.</p>
                                </div>

                                {/* 2. Key Player Toggles */}
                                <div className="space-y-4">
                                    <Label className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-400" />
                                        Squad Availability
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedTeam.topPlayers.map(player => (
                                            <div key={player.name} className="flex items-center justify-between rounded-md bg-white/5 p-2 border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-white">{player.name}</span>
                                                    <span className="text-[10px] text-white/40">{player.position}</span>
                                                </div>
                                                <Checkbox
                                                    checked={!teamSettings.injuredPlayers.includes(player.name)}
                                                    onCheckedChange={(checked) => {
                                                        const newInjured = checked
                                                            ? teamSettings.injuredPlayers.filter(p => p !== player.name)
                                                            : [...teamSettings.injuredPlayers, player.name]
                                                        updateTeamConfig(selectedTeam.id, { injuredPlayers: newInjured })
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white/40 italic">-30 Elo penalty for each unavailable star player.</p>
                                </div>

                                {/* 3. Tactical Style */}
                                <div className="space-y-4">
                                    <Label className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-purple-400" />
                                        Tactical Approach
                                    </Label>
                                    <Select
                                        value={teamSettings.tacticalStyle}
                                        onValueChange={(val: TacticalStyle) => updateTeamConfig(selectedTeam.id, { tacticalStyle: val })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            <SelectItem value="Defensive">Park the Bus (Low Score/Defensive)</SelectItem>
                                            <SelectItem value="Normal">Balanced (Standard)</SelectItem>
                                            <SelectItem value="Attacking">All Out Attack (High Score/Risky)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 4. Host Status */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2 text-indigo-300">
                                            <Globe className="h-4 w-4" />
                                            Home Advantage
                                        </Label>
                                        <p className="text-[10px] text-indigo-300/60">Grants +50 Elo boost for host support.</p>
                                    </div>
                                    <Switch
                                        checked={teamSettings.isHostOverride ?? (["USA", "MEX", "CAN"].includes(selectedTeam.code))}
                                        onCheckedChange={(val) => updateTeamConfig(selectedTeam.id, { isHostOverride: val })}
                                    />
                                </div>
                            </div>
                        )}

                        {!selectedTeam && (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-xl">
                                <Users className="h-10 w-10 text-white/10 mb-2" />
                                <p className="text-sm text-white/30">Select a team from the list above to customize their simulation parameters.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="global" className="p-4 m-0 space-y-8">
                        {/* Bayesian Elo Uncertainty Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2 text-purple-300">
                                    <Zap className="h-4 w-4" />
                                    Propagate Elo Uncertainty
                                </Label>
                                <p className="text-[10px] text-purple-300/60">Sample Elo from Bayesian distributions each iteration (σ per team).</p>
                            </div>
                            <Switch
                                checked={config.globalSettings.propagateUncertainty}
                                onCheckedChange={(val) => updateGlobalConfig({ propagateUncertainty: val })}
                            />
                        </div>

                        {/* Home Advantage Strength */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-indigo-400" />
                                    Home Advantage Strength
                                </Label>
                                <span className="text-sm font-bold text-indigo-400">
                                    +{config.globalSettings.homeAdvantageStrength} Elo
                                </span>
                            </div>
                            <Slider
                                value={[config.globalSettings.homeAdvantageStrength]}
                                min={0}
                                max={150}
                                step={10}
                                onValueChange={([val]) => updateGlobalConfig({ homeAdvantageStrength: val })}
                            />
                            <div className="flex justify-between text-[10px] text-white/40 font-mono">
                                <span>NO ADVANTAGE</span>
                                <span>FORTRESS</span>
                            </div>
                        </div>

                        {/* Target Upset Index */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-400" />
                                    Target Upset Index (Elo Flattening)
                                </Label>
                                <span className="text-sm font-bold text-orange-400">
                                    {config.globalSettings.targetUpsetIndex}%
                                </span>
                            </div>
                            <Slider
                                value={[config.globalSettings.targetUpsetIndex]}
                                min={10}
                                max={50}
                                step={1}
                                onValueChange={([val]) => updateGlobalConfig({ targetUpsetIndex: val })}
                            />
                            <div className="flex justify-between text-[10px] text-white/40 font-mono">
                                <span>FAVORITES WIN</span>
                                <span>TOTAL CHAOS</span>
                            </div>
                        </div>

                        {/* Target Penalty Rate */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-amber-400" />
                                    Target Penalty Rate (KO Draw Bias)
                                </Label>
                                <span className="text-sm font-bold text-amber-400">
                                    {config.globalSettings.targetPenaltyRate}%
                                </span>
                            </div>
                            <Slider
                                value={[config.globalSettings.targetPenaltyRate]}
                                min={10}
                                max={50}
                                step={1}
                                onValueChange={([val]) => updateGlobalConfig({ targetPenaltyRate: val })}
                            />
                            <div className="flex justify-between text-[10px] text-white/40 font-mono">
                                <span>RARE</span>
                                <span>FREQUENT</span>
                            </div>
                        </div>

                        {/* Tournament Entropy Multiplier */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Gauge className="h-4 w-4 text-purple-400" />
                                    Tournament Entropy (Elo Variance)
                                </Label>
                                <span className="text-sm font-bold text-purple-400">
                                    {config.globalSettings.entropyMultiplier.toFixed(1)}x
                                </span>
                            </div>
                            <Slider
                                value={[config.globalSettings.entropyMultiplier]}
                                min={0.1}
                                max={3.0}
                                step={0.1}
                                onValueChange={([val]) => updateGlobalConfig({ entropyMultiplier: val })}
                            />
                            <div className="flex justify-between text-[10px] text-white/40 font-mono">
                                <span>PREDICTABLE</span>
                                <span>WILD</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 mt-4">
                                Adjust these targets to manually control the emergent tournament analytics.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">Simulation Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-[10px] text-white/40 uppercase">Iterations</div>
                                    <div className="text-lg font-bold text-white">10,000</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-[10px] text-white/40 uppercase">Model</div>
                                    <div className="text-sm font-bold text-white">Dixon-Coles / Bayesian Elo</div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </Card>
    )
}
