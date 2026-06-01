import teamsData from "@/data/teams.json"
import playersData from "@/data/players.json"
import type { GameType, Difficulty, Question } from "./types"

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

function pickWrongByProximity(
  correct: TeamData,
  pool: TeamData[],
  difficulty: Difficulty,
  count: number
): TeamData[] {
  switch (difficulty) {
    case "easy": {
      return shuffleArray(pool).slice(0, count)
    }
    case "medium": {
      const sameConfed = pool.filter((t) => t.confederation === correct.confederation)
      const others = pool.filter((t) => t.confederation !== correct.confederation)
      const picks: TeamData[] = []
      picks.push(...shuffleArray(sameConfed))
      if (picks.length < count) picks.push(...shuffleArray(others))
      return picks.slice(0, count)
    }
    case "hard": {
      const sameGroup = pool.filter((t) => t.group === correct.group)
      const byRank = pool
        .filter((t) => t.group !== correct.group)
        .sort(
          (a, b) =>
            Math.abs(a.fifaRanking - correct.fifaRanking) -
            Math.abs(b.fifaRanking - correct.fifaRanking)
        )
      const picks: TeamData[] = []
      picks.push(...shuffleArray(sameGroup))
      picks.push(...byRank)
      return picks.slice(0, count)
    }
  }
}

function generateFlagQuestion(difficulty: Difficulty): Question {
  const correctTeam = teams[Math.floor(Math.random() * teams.length)]
  const wrongPool = teams.filter((t) => t.id !== correctTeam.id)
  const wrong = pickWrongByProximity(correctTeam, wrongPool, difficulty, 3)

  const options = shuffleArray([correctTeam.name, ...wrong.map((t) => t.name)])
  const correctIndex = options.indexOf(correctTeam.name)

  return {
    clueType: "flag",
    correctAnswer: correctTeam.name,
    options,
    correctIndex,
    teamId: correctTeam.id,
  }
}

function generateKitQuestion(difficulty: Difficulty): Question {
  const correctTeam = teams[Math.floor(Math.random() * teams.length)]
  const wrongPool = teams.filter((t) => t.id !== correctTeam.id)
  const wrong = pickWrongByProximity(correctTeam, wrongPool, difficulty, 3)

  const options = shuffleArray([correctTeam.name, ...wrong.map((t) => t.name)])
  const correctIndex = options.indexOf(correctTeam.name)

  return {
    clueType: "kit",
    correctAnswer: correctTeam.name,
    options,
    correctIndex,
    teamId: correctTeam.id,
  }
}

function generatePlayerQuestion(difficulty: Difficulty): Question {
  const correctPlayer = players[Math.floor(Math.random() * players.length)]
  const wrongPool = players.filter((p) => p.name !== correctPlayer.name)
  let wrong: PlayerData[]

  switch (difficulty) {
    case "easy":
      wrong = shuffleArray(wrongPool).slice(0, 3)
      break
    case "medium": {
      const sameNat = wrongPool.filter(
        (p) => p.nationalTeamCode === correctPlayer.nationalTeamCode
      )
      const others = wrongPool.filter(
        (p) => p.nationalTeamCode !== correctPlayer.nationalTeamCode
      )
      wrong = []
      wrong.push(...shuffleArray(sameNat))
      if (wrong.length < 3) wrong.push(...shuffleArray(others))
      wrong = wrong.slice(0, 3)
      break
    }
    case "hard": {
      const samePos = wrongPool.filter((p) => p.position === correctPlayer.position)
      const byScore = wrongPool
        .filter((p) => p.position !== correctPlayer.position)
        .sort(
          (a, b) =>
            Math.abs(a.compositeScore - correctPlayer.compositeScore) -
            Math.abs(b.compositeScore - correctPlayer.compositeScore)
        )
      wrong = []
      wrong.push(...shuffleArray(samePos))
      wrong.push(...byScore)
      wrong = wrong.slice(0, 3)
      break
    }
  }

  const options = shuffleArray([correctPlayer.name, ...wrong.map((p) => p.name)])
  const correctIndex = options.indexOf(correctPlayer.name)
  const playerIndex = players.indexOf(correctPlayer)

  return {
    clueType: "player",
    correctAnswer: correctPlayer.name,
    options,
    correctIndex,
    playerIndex,
    playerInfo: `${correctPlayer.nationality} · ${correctPlayer.club}`,
  }
}

export function generateQuestion(gameType: GameType, difficulty: Difficulty): Question {
  switch (gameType) {
    case "flag":
      return generateFlagQuestion(difficulty)
    case "kit":
      return generateKitQuestion(difficulty)
    case "player":
      return generatePlayerQuestion(difficulty)
  }
}

export function generateQuestionBatch(
  gameType: GameType,
  difficulty: Difficulty,
  count: number
): Question[] {
  const questions: Question[] = []
  const seen = new Set<string>()

  let attempts = 0
  while (questions.length < count && attempts < count * 10) {
    attempts++
    const q = generateQuestion(gameType, difficulty)
    const key = `${q.clueType}-${q.correctAnswer}`
    if (!seen.has(key)) {
      seen.add(key)
      questions.push(q)
    }
  }

  return questions
}
