"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "wc2026-my-team"

export function useMyTeam() {
  const [selectedTeam, setSelectedTeamState] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedTeamState(stored)
    }
    setIsLoaded(true)
  }, [])

  const setSelectedTeam = useCallback((teamId: string | null) => {
    setSelectedTeamState(teamId)
    if (teamId) {
      localStorage.setItem(STORAGE_KEY, teamId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearTeam = useCallback(() => {
    setSelectedTeamState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { selectedTeam, setSelectedTeam, clearTeam, isLoaded }
}
