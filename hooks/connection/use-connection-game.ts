"use client"

import { create } from "zustand"
import type { Player, Difficulty, GameMode, GameConfig, ValidationResult, HintType } from "@/lib/connection/types"
import { getMaxConnectionsForDifficulty } from "@/lib/connection/types"
import { getGraphInstance } from "@/lib/connection/graph"
import { validateSolution, getHint, calculateChipReward } from "@/lib/connection/game-logic"

interface ConnectionGameStore {
  playerA: Player | null
  playerB: Player | null
  chain: Player[]
  score: number
  attempts: number
  startTime: number | null
  elapsedTime: number
  isComplete: boolean
  isCorrect: boolean | null
  validationResult: ValidationResult | null
  showHint: boolean
  hintChain: Player[] | null
  hintType: HintType | null
  usedHint: boolean
  hasValidPath: boolean
  difficulty: Difficulty
  mode: GameMode
  gameStarted: boolean
  timerInterval: NodeJS.Timeout | null
  error: string | null
  loading: boolean

  startGame: (difficulty: Difficulty, mode: GameMode) => void
  setDifficulty: (d: Difficulty) => void
  setMode: (m: GameMode) => void
  addToChain: (player: Player) => void
  removeFromChain: (index: number) => void
  submitSolution: () => void
  submitNoConnection: () => void
  getHintAction: () => void
  resetGame: () => void
  tick: () => void
  getConfig: () => GameConfig
}

export const useConnectionGame = create<ConnectionGameStore>((set, get) => ({
  playerA: null,
  playerB: null,
  chain: [],
  score: 0,
  attempts: 0,
  startTime: null,
  elapsedTime: 0,
  isComplete: false,
  isCorrect: null,
  validationResult: null,
  showHint: false,
  hintChain: null,
  hintType: null,
  usedHint: false,
  hasValidPath: true,
  difficulty: "medium",
  mode: "infinite",
  gameStarted: false,
  timerInterval: null,
  error: null,
  loading: false,

  startGame: (difficulty, mode) => {
    set({ loading: true, error: null, gameStarted: false })
    const graph = getGraphInstance()
    let maxConn = getMaxConnectionsForDifficulty(difficulty)
    let pair = graph.getRandomPair(maxConn)

    let hasValidPath = true
    let noConnectionPair: { playerA: Player; playerB: Player } | null = null

    if (!pair) {
      for (let d = maxConn - 1; d >= 1; d--) {
        pair = graph.getRandomPair(d)
        if (pair) break
      }
    }

    if (!pair) {
      const graph = getGraphInstance()
      noConnectionPair = graph.getRandomNoConnectionPair(maxConn)
      if (noConnectionPair) {
        hasValidPath = false
      }
    }

    const chosenPair = pair ?? noConnectionPair

    if (!chosenPair) {
      set({ loading: false, error: "Could not generate a puzzle. Try a different difficulty.", gameStarted: false })
      return
    }

    const state = get()
    if (state.timerInterval) clearInterval(state.timerInterval)

    const interval = setInterval(() => {
      get().tick()
    }, 1000)

    set({
      playerA: chosenPair.playerA,
      playerB: chosenPair.playerB,
      chain: [],
      score: 0,
      attempts: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      isComplete: false,
      isCorrect: null,
      validationResult: null,
      showHint: false,
      hintChain: null,
      hintType: null,
      usedHint: false,
      hasValidPath,
      difficulty,
      mode,
      gameStarted: true,
      error: null,
      loading: false,
      timerInterval: interval,
    })
  },

  setDifficulty: (d) => set({ difficulty: d }),
  setMode: (m) => set({ mode: m }),

  addToChain: (player) => {
    const { chain } = get()
    if (chain.some((p) => p.id === player.id)) return
    set({ chain: [...chain, player] })
  },

  removeFromChain: (index) => {
    const { chain } = get()
    set({ chain: chain.filter((_, i) => i !== index) })
  },

  submitSolution: () => {
    const { playerA, playerB, chain, attempts, difficulty, mode, startTime, usedHint } = get()
    if (!playerA || !playerB) return

    const result = validateSolution(playerA, playerB, chain)
    const newAttempts = attempts + 1

    if (result.valid) {
      const timeSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
      const graph = getGraphInstance()
      const shortestResult = graph.findShortestPath(
        playerA.id,
        playerB.id,
        getMaxConnectionsForDifficulty(difficulty) + 1
      )
      const shortestPossible = shortestResult ? shortestResult.path.length - 1 : chain.length

      const chipReward = calculateChipReward(difficulty, usedHint)
      const efficiencyBonus = chain.length <= shortestPossible && !usedHint
        ? Math.round(chipReward * 0.5)
        : 0
      const score = chipReward + efficiencyBonus

      set({
        isComplete: true,
        isCorrect: true,
        validationResult: result,
        score,
        attempts: newAttempts,
      })

      fetch("/api/connection/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          difficulty,
          mode,
          chainLength: chain.length,
          shortestPossible,
          attempts: newAttempts,
          timeSeconds,
          usedHint,
          playerA: playerA.name,
          playerB: playerB.name,
        }),
      }).catch(() => {})

      if (chipReward > 0) {
        fetch("/api/chips/earn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: chipReward, source: "connection" }),
        }).catch(() => {})
      }
    } else {
      set({
        isCorrect: false,
        validationResult: result,
        attempts: newAttempts,
      })
    }
  },

  submitNoConnection: () => {
    const { playerA, playerB, difficulty, mode, hasValidPath, startTime } = get()
    if (!playerA || !playerB) return
    if (hasValidPath) {
      set({
        isComplete: true,
        isCorrect: false,
        validationResult: {
          valid: false,
          chain: [],
          errors: ["There IS a connection between these players — find it!"],
        },
      })
      return
    }

    const chipReward = calculateChipReward(difficulty, false)
    const timeSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

    set({
      isComplete: true,
      isCorrect: true,
      score: chipReward,
    })

    fetch("/api/connection/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: chipReward,
        difficulty,
        mode,
        chainLength: 0,
        shortestPossible: 0,
        attempts: 1,
        timeSeconds,
        usedHint: false,
        playerA: playerA.name,
        playerB: playerB.name,
      }),
    }).catch(() => {})

    if (chipReward > 0) {
      fetch("/api/chips/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: chipReward, source: "connection" }),
      }).catch(() => {})
    }
  },

  getHintAction: () => {
    const { playerA, playerB, difficulty } = get()
    if (!playerA || !playerB) return

    set({ usedHint: true })

    const graph = getGraphInstance()
    const maxHops = getMaxConnectionsForDifficulty(difficulty) + 1
    const result = graph.findShortestPath(playerA.id, playerB.id, maxHops)

    if (!result) {
      set({ hintChain: null, hintType: "unavailable" })
      return
    }

    const intermediates = result.path.slice(1, -1).map((id) => graph.getPlayer(id)!).filter(Boolean)

    if (intermediates.length > 0) {
      set({ hintChain: intermediates, hintType: "path" })
    } else {
      const sharedTeam = result.sharedTeams[0]?.[0]
      set({ hintChain: [], hintType: "direct" })
    }
  },

  resetGame: () => {
    const { difficulty, mode, timerInterval } = get()
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    set({
      playerA: null,
      playerB: null,
      chain: [],
      score: 0,
      attempts: 0,
      startTime: null,
      elapsedTime: 0,
      isComplete: false,
      isCorrect: null,
      validationResult: null,
      showHint: false,
      hintChain: null,
      hintType: null,
      hasValidPath: true,
      gameStarted: false,
      error: null,
      loading: false,
      timerInterval: null,
    })
    get().startGame(difficulty, mode)
  },

  tick: () => {
    const { startTime, isComplete } = get()
    if (!startTime || isComplete) return
    set({ elapsedTime: Math.floor((Date.now() - startTime) / 1000) })
  },

  getConfig: () => {
    const { difficulty, mode } = get()
    return {
      difficulty,
      mode,
      maxConnections: getMaxConnectionsForDifficulty(difficulty),
    }
  },
}))
