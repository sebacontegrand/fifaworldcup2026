"use client"

import { create } from "zustand"
import type { Player, Difficulty, GameMode, GameConfig, ValidationResult } from "@/lib/connection/types"
import { getMaxConnectionsForDifficulty } from "@/lib/connection/types"
import { getGraphInstance } from "@/lib/connection/graph"
import { validateSolution, getHint, calculateScore } from "@/lib/connection/game-logic"

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

    if (!pair) {
      for (let d = maxConn + 1; d <= 4; d++) {
        pair = graph.getRandomPair(d)
        if (pair) break
      }
    }

    if (!pair) {
      set({ loading: false, error: "Could not generate a puzzle. Try a different difficulty.", gameStarted: false })
      return
    }

    const state = get()
    if (state.timerInterval) clearInterval(state.timerInterval)

    const interval = setInterval(() => {
      get().tick()
    }, 1000)

    set({
      playerA: pair.playerA,
      playerB: pair.playerB,
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
    const { playerA, playerB, chain, attempts, difficulty, mode, startTime } = get()
    if (!playerA || !playerB) return

    const result = validateSolution(playerA, playerB, chain)
    const newAttempts = attempts + 1

    if (result.valid) {
      const timeSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
      const graph = getGraphInstance()
      const shortestResult = graph.findShortestPath(
        playerA.id,
        playerB.id,
        getMaxConnectionsForDifficulty(difficulty)
      )
      const shortestPossible = shortestResult ? shortestResult.path.length - 1 : chain.length

      const score = calculateScore({
        chainLength: chain.length,
        shortestPossible,
        attempts: newAttempts,
        timeSeconds,
        difficulty,
        mode,
      })

      set({
        isComplete: true,
        isCorrect: true,
        validationResult: result,
        score,
        attempts: newAttempts,
      })
    } else {
      set({
        isCorrect: false,
        validationResult: result,
        attempts: newAttempts,
      })
    }
  },

  getHintAction: () => {
    const { playerA, playerB, difficulty } = get()
    if (!playerA || !playerB) return

    const hint = getHint(playerA, playerB, difficulty)
    set({ hintChain: hint })
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
