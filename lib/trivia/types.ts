export type GameType = "flag" | "kit" | "player"
export type Difficulty = "easy" | "medium" | "hard"

export interface Question {
  clueType: GameType
  correctAnswer: string
  options: string[]
  correctIndex: number
  teamId?: string
  playerIndex?: number
  playerInfo?: string
}

export interface GameState {
  questions: Question[]
  currentIndex: number
  score: number
  chips: number
  streak: number
  bestStreak: number
  answersCorrect: number
  answersWrong: number
  isComplete: boolean
  difficulty: Difficulty
  gameType: GameType
}

export function getItemCountForDifficulty(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 5
    case "medium": return 10
    case "hard": return 15
  }
}
