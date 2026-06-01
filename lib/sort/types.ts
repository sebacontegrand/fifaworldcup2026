export type SortTarget = "teams" | "players"
export type TeamSortCriterion = "fifaRanking" | "eloRating" | "alphabetical" | "group"
export type PlayerSortCriterion = "goals2526" | "assists2526" | "age" | "compositeScore" | "rank"
export type Difficulty = "easy" | "medium" | "hard"

export interface SortItem {
  id: string
  label: string
  subtitle: string
  value: string
  image?: string
}

export interface SortQuestion {
  items: SortItem[]
  shuffledItems: SortItem[]
  criterionLabel: string
  targetLabel: string
}

export interface SortGameState {
  score: number
  chips: number
  round: number
  totalRounds: number
  isComplete: boolean
}

export function getItemCountForDifficulty(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 4
    case "medium": return 6
    case "hard": return 8
  }
}

export function getRoundsForDifficulty(_difficulty: Difficulty): number {
  return 5
}
