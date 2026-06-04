"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { runFullSimulation, type SimulationResult, type SimulationConfig, type TeamSimulationConfig, type TournamentState, type MatchOverride } from "@/lib/simulation"

interface FactMatch {
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
  isFact: boolean
}

async function mergeFactResultsWithOverrides(
  tournamentState: TournamentState
): Promise<TournamentState> {
  try {
    const res = await fetch("/api/matches")
    const matches: FactMatch[] = await res.json()
    const factOverrides: Record<string, MatchOverride> = {}

    for (const match of matches) {
      if (match.isFact && match.teamAId && match.teamBId && match.scoreA !== null && match.scoreB !== null) {
        const key = `${match.teamAId}_${match.teamBId}`
        factOverrides[key] = {
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          winnerId:
            match.scoreA > match.scoreB
              ? match.teamAId
              : match.scoreB > match.scoreA
                ? match.teamBId
                : undefined,
        }
      }
    }

    return {
      ...tournamentState,
      matchOverrides: { ...factOverrides, ...tournamentState.matchOverrides },
    }
  } catch {
    return tournamentState
  }
}

const INITIAL_CONFIG: SimulationConfig = {
  teamSettings: {},
  globalSettings: {
    targetUpsetIndex: 15,    // Baseline upset frequency ~15%
    targetPenaltyRate: 15,   // Baseline penalty rate ~15%
    entropyMultiplier: 1.0,  // Baseline Elo uncertainty scalar
    propagateUncertainty: true,
    homeAdvantageStrength: 80,
  },
}

const INITIAL_TOURNAMENT_STATE: TournamentState = {
  matchOverrides: {},
  stageAnchors: {
    semifinals: [],
    finals: [],
    champion: null,
  },
}

interface SimulationContextType {
  result: SimulationResult | null
  isRunning: boolean
  config: SimulationConfig
  tournamentState: TournamentState
  currentTournamentDate: string
  setCurrentTournamentDate: (date: string) => void
  simulate: () => void
  updateTeamConfig: (teamId: string, settings: Partial<TeamSimulationConfig>) => void
  updateGlobalConfig: (settings: Partial<SimulationConfig["globalSettings"]>) => void
  updateMatchResult: (teamAId: string, teamBId: string, override: MatchOverride | null) => void
  setStageAnchor: (stage: keyof TournamentState["stageAnchors"], teamIds: string[] | string | null) => void
  resetConfig: () => void
}


const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG)
  const [tournamentState, setTournamentState] = useState<TournamentState>(INITIAL_TOURNAMENT_STATE)
  const [currentTournamentDate, setCurrentTournamentDate] = useState("2026-06-18")
  const loaded = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from DB on mount
  useEffect(() => {
    let cancelled = false

    fetch("/api/simulation/config")
      .then(r => r.json())
      .then(async data => {
        if (cancelled) return

        let newConfig = INITIAL_CONFIG
        if (data.config && Object.keys(data.config).length > 0) {
          newConfig = { ...INITIAL_CONFIG, ...data.config, teamSettings: { ...INITIAL_CONFIG.teamSettings, ...data.config.teamSettings } }
        }
        setConfig(newConfig)

        let newState = INITIAL_TOURNAMENT_STATE
        if (data.tournamentState && Object.keys(data.tournamentState).length > 0) {
          newState = { ...INITIAL_TOURNAMENT_STATE, ...data.tournamentState, matchOverrides: { ...data.tournamentState.matchOverrides } }
        }

        // Merge fact results from DB into match overrides
        const mergedState = await mergeFactResultsWithOverrides(newState)
        if (!cancelled) setTournamentState(mergedState)

        if (data.currentTournamentDate) {
          setCurrentTournamentDate(data.currentTournamentDate)
        }
        loaded.current = true
      })
      .catch(() => { loaded.current = true })

    return () => { cancelled = true }
  }, [])

  // Auto-save to DB when config or tournamentState changes (debounced)
  useEffect(() => {
    if (!loaded.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch("/api/simulation/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, tournamentState, currentTournamentDate }),
      }).catch(() => {})
    }, 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [config, tournamentState, currentTournamentDate])

  const simulate = useCallback(() => {
    setIsRunning(true)

    // Merge latest fact results from DB, then run simulation
    ;(async () => {
      const mergedState = await mergeFactResultsWithOverrides(tournamentState)
      setTournamentState(mergedState)

      // Use setTimeout to allow the UI to update with loading state before heavy calculation
      setTimeout(() => {
        const simResult = runFullSimulation(config, mergedState)
        setResult(simResult)
        setIsRunning(false)
      }, 100)
    })()
  }, [config, tournamentState])

  const updateTeamConfig = useCallback((teamId: string, settings: Partial<TeamSimulationConfig>) => {
    setConfig(prev => {
      const currentTeamSettings = prev.teamSettings[teamId] || {
        eloAdjustment: 0,
        injuredPlayers: [],
        tacticalStyle: "Normal",
        isHostOverride: null
      }

      return {
        ...prev,
        teamSettings: {
          ...prev.teamSettings,
          [teamId]: {
            ...currentTeamSettings,
            ...settings
          }
        }
      }
    })
  }, [])

  const updateGlobalConfig = useCallback((settings: Partial<SimulationConfig["globalSettings"]>) => {
    setConfig(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        ...settings
      }
    }))
  }, [])

  const updateMatchResult = useCallback((teamAId: string, teamBId: string, override: MatchOverride | null) => {
    setTournamentState(prev => {
      const key = `${teamAId}_${teamBId}`
      const newOverrides = { ...prev.matchOverrides }
      if (override === null) {
        delete newOverrides[key]
      } else {
        newOverrides[key] = override
      }
      return { ...prev, matchOverrides: newOverrides }
    })
  }, [])

  const setStageAnchor = useCallback((stage: keyof TournamentState["stageAnchors"], teamIds: string[] | string | null) => {
    setTournamentState(prev => {
      const newAnchors = { ...prev.stageAnchors }
      if (stage === "champion") {
        newAnchors.champion = teamIds as string | null
      } else {
        newAnchors[stage] = teamIds as string[]
      }
      return { ...prev, stageAnchors: newAnchors }
    })
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(INITIAL_CONFIG)
    setTournamentState(INITIAL_TOURNAMENT_STATE)
    fetch("/api/simulation/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: INITIAL_CONFIG, tournamentState: INITIAL_TOURNAMENT_STATE, currentTournamentDate: "2026-06-18" }),
    }).catch(() => {})
  }, [])

  return (
    <SimulationContext.Provider value={{
      result,
      isRunning,
      config,
      tournamentState,
      currentTournamentDate,
      setCurrentTournamentDate,
      simulate,
      updateTeamConfig,
      updateGlobalConfig,
      updateMatchResult,
      setStageAnchor,
      resetConfig
    }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
