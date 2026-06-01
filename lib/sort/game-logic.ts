import teamsData from "@/data/teams.json"
import playersData from "@/data/players.json"
import type {
  SortTarget,
  TeamSortCriterion,
  PlayerSortCriterion,
  Difficulty,
  SortItem,
  SortQuestion,
} from "./types"
import { getItemCountForDifficulty } from "./types"

interface TeamData {
  id: string
  name: string
  code: string
  flag: string
  group: string
  fifaRanking: number
  confederation: string
  eloRating: number
  topPlayers: { name: string; position: string; club: string; age: number }[]
  stats: { worldCupAppearances: number; bestFinish: string; recentForm: string }
  attackStrength: number
  defenseStrength: number
  eloSigma: number
}

interface PlayerData {
  rank: number
  name: string
  nationality: string
  nationalTeamCode: string
  club: string
  position: string
  age: number
  goals2526: number
  assists2526: number
  competitionWins: string[]
  compositeScore: number
}

const teams = teamsData as TeamData[]
const players = playersData as PlayerData[]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const teamCriterionLabels: Record<TeamSortCriterion, string> = {
  fifaRanking: "FIFA Ranking (1st = best)",
  eloRating: "Elo Rating (highest = best)",
  alphabetical: "Alphabetical (A-Z)",
  group: "Group Letter (A-H)",
}

const playerCriterionLabels: Record<PlayerSortCriterion, string> = {
  goals2526: "Goals 25/26 (most first)",
  assists2526: "Assists 25/26 (most first)",
  age: "Age (youngest first)",
  compositeScore: "Composite Score (highest first)",
  rank: "Player Rank (1st = best)",
}

function getTeamValue(team: TeamData, criterion: TeamSortCriterion): number | string {
  switch (criterion) {
    case "fifaRanking":
      return team.fifaRanking
    case "eloRating":
      return -team.eloRating
    case "alphabetical":
      return team.name
    case "group":
      return team.group
  }
}

function getPlayerValue(player: PlayerData, criterion: PlayerSortCriterion): number | string {
  switch (criterion) {
    case "goals2526":
      return -player.goals2526
    case "assists2526":
      return -player.assists2526
    case "age":
      return player.age
    case "compositeScore":
      return -player.compositeScore
    case "rank":
      return player.rank
  }
}

function pickConsecutiveBlock<T>(
  sorted: T[],
  count: number,
  difficulty: Difficulty
): T[] {
  if (sorted.length <= count) return sorted

  if (difficulty === "easy") {
    const indices = shuffleArray(Array.from({ length: sorted.length }, (_, i) => i))
    return indices.slice(0, count).map((i) => sorted[i])
  }

  const padding = difficulty === "hard" ? 0 : 2
  const blockSize = count + padding
  const maxStart = sorted.length - blockSize
  const start = Math.floor(Math.random() * Math.max(1, maxStart + 1))
  const block = sorted.slice(start, start + blockSize)

  const picked = shuffleArray(block).slice(0, count)
  return picked
}

function sortTeamsByCriterion(items: TeamData[], criterion: TeamSortCriterion): TeamData[] {
  return [...items].sort((a, b) => {
    const va = getTeamValue(a, criterion)
    const vb = getTeamValue(b, criterion)
    if (typeof va === "number" && typeof vb === "number") return va - vb
    return String(va).localeCompare(String(vb))
  })
}

function sortPlayersByCriterion(items: PlayerData[], criterion: PlayerSortCriterion): PlayerData[] {
  return [...items].sort((a, b) => {
    const va = getPlayerValue(a, criterion)
    const vb = getPlayerValue(b, criterion)
    if (typeof va === "number" && typeof vb === "number") return va - vb
    return String(va).localeCompare(String(vb))
  })
}

function formatTeamValue(team: TeamData, criterion: TeamSortCriterion): string {
  switch (criterion) {
    case "fifaRanking":
      return `#${team.fifaRanking}`
    case "eloRating":
      return String(team.eloRating)
    case "alphabetical":
      return team.name[0]
    case "group":
      return `Group ${team.group}`
  }
}

function formatPlayerValue(player: PlayerData, criterion: PlayerSortCriterion): string {
  switch (criterion) {
    case "goals2526":
      return `${player.goals2526} goals`
    case "assists2526":
      return `${player.assists2526} assists`
    case "age":
      return `${player.age} yrs`
    case "compositeScore":
      return `${player.compositeScore} pts`
    case "rank":
      return `#${player.rank}`
  }
}

export function generateSortQuestion(
  target: SortTarget,
  criterion: TeamSortCriterion | PlayerSortCriterion,
  difficulty: Difficulty
): SortQuestion {
  const count = getItemCountForDifficulty(difficulty)

  if (target === "teams") {
    const tc = criterion as TeamSortCriterion
    const sorted = sortTeamsByCriterion(teams, tc)
    const picked = pickConsecutiveBlock(sorted, count, difficulty)
    const finalSorted = sortTeamsByCriterion(picked, tc)

    const items: SortItem[] = finalSorted.map((t) => ({
      id: t.id,
      label: `${t.flag} ${t.name}`,
      subtitle: t.confederation,
      value: formatTeamValue(t, tc),
    }))

    return {
      items,
      shuffledItems: shuffleArray(items),
      criterionLabel: teamCriterionLabels[tc],
      targetLabel: "teams",
    }
  }

  const pc = criterion as PlayerSortCriterion
  const sorted = sortPlayersByCriterion(players, pc)
  const picked = pickConsecutiveBlock(sorted, count, difficulty)
  const finalSorted = sortPlayersByCriterion(picked, pc)

  const items: SortItem[] = finalSorted.map((p, i) => {
    const flag = getFlagByCode(p.nationalTeamCode)
    return {
      id: `player-${p.rank}`,
      label: `${flag} ${p.name}`,
      subtitle: `${p.position} · ${p.club}`,
      value: formatPlayerValue(p, pc),
    }
  })

  return {
    items,
    shuffledItems: shuffleArray(items),
    criterionLabel: playerCriterionLabels[pc],
    targetLabel: "players",
  }
}

function getFlagByCode(code: string): string {
  const team = teams.find((t) => t.code === code)
  return team?.flag ?? ""
}

export function scoreSortAttempt(
  userOrder: SortItem[],
  correctOrder: SortItem[]
): number {
  if (userOrder.length !== correctOrder.length) return 0

  let correctPairs = 0
  let totalPairs = 0

  for (let i = 0; i < userOrder.length; i++) {
    for (let j = i + 1; j < userOrder.length; j++) {
      totalPairs++
      const correctI = correctOrder.findIndex((item) => item.id === userOrder[i].id)
      const correctJ = correctOrder.findIndex((item) => item.id === userOrder[j].id)
      if (correctI < correctJ) correctPairs++
    }
  }

  return totalPairs > 0 ? Math.round((correctPairs / totalPairs) * 100) : 0
}
