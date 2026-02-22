"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { runFullSimulation, type SimulationResult, type SimulationConfig, type TeamSimulationConfig, type TournamentState, type MatchOverride } from "@/lib/simulation"

const INITIAL_CONFIG: SimulationConfig = {
  teamSettings: {},
  globalSettings: {
    chaosFactor: 0,
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
  const hasRunInitial = useRef(false)

  const simulate = useCallback(() => {
    setIsRunning(true)

    // Use setTimeout to allow the UI to update with loading state before heavy calculation
    setTimeout(() => {
      const simResult = runFullSimulation(config, tournamentState)
      setResult(simResult)
      setIsRunning(false)
    }, 100)
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
  }, [])

  useEffect(() => {
    if (hasRunInitial.current) return
    hasRunInitial.current = true
    simulate()
  }, [simulate])

  return (
    <SimulationContext.Provider value={{
      result,
      isRunning,
      config,
      tournamentState,
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
