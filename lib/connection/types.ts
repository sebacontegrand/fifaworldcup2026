export interface Player {
  id: string
  name: string
  image?: string
  nationality: string
  nationalityFlag?: string
  teams: TeamExperience[]
  position?: string
}

export interface TeamExperience {
  teamId: string
  teamName: string
  startYear?: number
  endYear?: number
  logo?: string
}

export interface Team {
  id: string
  name: string
  logo?: string
}

export type Difficulty = "easy" | "medium" | "hard" | "expert"

export type GameMode = "daily" | "infinite" | "hardcore" | "timed"

export interface ChainLink {
  player: Player
  sharedTeam?: string
}

export interface ValidationResult {
  valid: boolean
  chain: ChainLink[]
  errors?: string[]
  score?: number
}

export interface GameConfig {
  difficulty: Difficulty
  mode: GameMode
  maxConnections: number
}

export function getMaxConnectionsForDifficulty(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 1
    case "medium": return 2
    case "hard": return 3
    case "expert": return 4
  }
}

export type HintType = "path" | "direct" | "unavailable"

export interface GameState {
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
}
